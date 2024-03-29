
@import "test.js"


let sizes = {
		"10": {w: 260, h: 266, x: 9, y: 9},
		"20": {w: 441, h: 447, x: 16, y: 16},
		"99": {w: 807, h: 448, x: 30, y: 16}
	};
let board;
let nMines = 20;
let start_time = 0;
let PreFld = false;
let Fld = false;
let timer_started = false;
let game_over = true;
let SelX, SelY;


// default settings
const defaultSettings = {
	"game-theme": "modern",
	"board-size": 20,
	"pgn": "",
};



const mines = {
	el: {},
	init() {
		// fast references
		this.el.content = window.find("content");
		this.el.board = window.find(".game-board");
		this.el.smiley = window.find(".icon-smiley");
		this.el.timerSpan = window.find(".timer span");
		this.el.countSpan = window.find(".mine-count span");
		this.el.solvedSpan = window.find(".seconds-solved");
		
		// get settings, if any
		this.settings = window.settings.getItem("settings") || defaultSettings;
		// apply settings
		this.dispatch({ type: "apply-settings" });

		if (this.settings.pgn) {
			let pgn = this.settings.pgn;
			this.dispatch({ type: "game-from-pgn", pgn });
		} else {
			let arg = this.settings["board-size"] || 20;
			this.dispatch({ type: "new-game", arg });
		}

		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		let Self = mines,
			name,
			value,
			nn, x, y,
			str,
			now,
			block;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.close":
				// save game state
				Self.settings.pgn = game_over ? "" : Self.dispatch({ type: "output-pgn" });
				// save settings
				window.settings.setItem("settings", Self.settings);
				break;
			// custom events
			case "apply-settings":
				// apply settings
				for (name in Self.settings) {
					value = Self.settings[name];
					// update menu
					window.bluePrint.selectNodes(`//Menu[@check-group="${name}"]`).map(xMenu => {
						let xArg = xMenu.getAttribute("arg");
						xMenu.removeAttribute("is-checked");
						if (xArg == value) {
							// update menu item
							xMenu.setAttribute("is-checked", 1);
							// call dispatch
							let type = xMenu.getAttribute("click");
							Self.dispatch({ type, arg: value});
						}
					});
				}
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
			case "select-block":
				block = event.target;
				x = block.getAttribute("X");
				y = block.getAttribute("Y");

				SelX = new Number(x);
				SelY = new Number(y);
				if (SelX < 0 || SelY < 0 || game_over === true) return;
				if (!timer_started && game_over === "new_board") {
					timer_started = true;
					game_over = false;
					Self.dispatch({ type: "start-timer" });
				}

				if (event.button <= 1 && (!event.ctrlKey && !event.metaKey)) {
					if (Fld[SelY][SelX] == 0) {
						if (PreFld[SelY][SelX] >= 0) {
							Self.showFld(SelX, SelY);
							Self.checkOver(); 
						} else {
							Fld[SelY][SelX] = -1;
							Self.setOver();
						}
					}
				} else {
					if (Fld[SelY][SelX] >= 0) {
						Fld[SelY][SelX]++;
						Fld[SelY][SelX] %= 3;
						if (Fld[SelY][SelX] == 0) {
							Self.el.blocks[board.x * SelY + SelX].className = "blank";
						}
						if (Fld[SelY][SelX] == 1) {
							Self.el.blocks[board.x * SelY + SelX].className = "flag";
						}
						if (Fld[SelY][SelX] == 2) {
							Self.el.blocks[board.x * SelY + SelX].className = "qmark";
						}
						Self.flagCount();
						Self.checkOver();
					}
				}
				break;
			case "start-timer":
				start_time = Date.now();
				if (event.seconds) start_time -= event.seconds;
				// reset timer
				Self.timeCount();
				break;
			case "new-game":
				nMines = +event.arg || nMines
				board = sizes[nMines];

				PreFld = new Array(board.y);
				Fld = new Array(board.y);
				for (nn=0; nn < board.y; nn++) PreFld[nn] = new Array(board.x);
				for (nn=0; nn < board.y; nn++) Fld[nn] = new Array(board.x);

				// draw board
				str = "";
				for (y=0; y<board.y; y++) {
					for (x=0; x<board.x; x++) {
						PreFld[y][x] = 0;
						Fld[y][x] = 0;
						str += `<div Y="${y}" X="${x}" class="blank"></div>`;
					}
				}
				Self.el.board.html(str);
				// fast reference
				Self.el.blocks = mines.el.board.find("div");
				// reset content
				Self.el.content.removeClass("game-won");
				// update window dimensions
				window.width = board.w;
				window.height = board.h;

				nn = 0;
				while (nn < nMines) {
					x = Math.round(Math.random() * 1000) % board.x;
					y = Math.round(Math.random() * 1000) % board.y;
					if (Self.setMine(x, y)) nn++;
				}
				// update smiley
				Self.el.smiley.removeClass("sad cool");
				// update flag counter
				Self.flagCount();

				timer_started = false;
				game_over = "new_board";
				clearTimeout(Self.timer);
				Self.el.timerSpan.attr({ "class": "d0" });

				// save "board size" to settings
				Self.settings["board-size"] = nMines;
				break;
			case "game-from-pgn":
				let pgn = event.pgn.split("\n"),
					[size, seconds, state] = pgn[0].split(":");

				// game state + time
				game_over = state === "over";
				seconds = +seconds * 1000;
				start_time = Date.now() - seconds;
				nMines = size;

				board = sizes[+size];
				Fld = pgn[1].split(":").map(row => row.split(",").map(i => +i));
				PreFld = pgn[2].split(":").map(row => row.split(",").map(i => +i));
				// console.log( PreFld );
				// console.log( Fld );

				// draw board
				str = [];
				for (y=0; y<board.y; y++) {
					for (x=0; x<board.x; x++) {
						let cell = "mines0";
						if (Fld[y][x] === 0) cell = "blank";
						else if (Fld[y][x] === 1) cell = "flag";
						else if (Fld[y][x] === 2) cell = "qmark";
						else if (PreFld[y][x] > 0) cell = `mines${PreFld[y][x]}`;
						else if (PreFld[y][x] === -1) cell = "mine";
						else if (PreFld[y][x] === -2) cell = "red";
						
						// if (y == 0 && x == 0) console.log( Fld[y][x], cell );

						if (game_over) {
							if (PreFld[y][x] === -1) cell = "mine";
							if (Fld[y][x] === 1 && Fld[y][x] !== -1) cell = "cross";
						}

						str.push(`<div Y="${y}" X="${x}" class="${cell}"></div>`);
					}
				}
				Self.el.board.html(str.join(""));
				// fast reference
				Self.el.blocks = mines.el.board.find("div");

				// update window dimensions
				window.width = board.w;
				window.height = board.h;

				Self.flagCount();

				if (game_over) {
					Self.timeCount();
				} else if (seconds > 0) {
					// start timer
					timer_started = true;
					Self.dispatch({ type: "start-timer", seconds });
				} else {
					game_over = "new_board";
				}
				break;
			case "set-theme":
				Self.el.content.data({ theme: event.arg });
				// save "theme" to settings
				Self.settings["game-theme"] = event.arg;
				break;
			case "output-pgn":
				str = [];
				Object.keys(sizes).map(key => {
					if (JSON.stringify(sizes[key]) === JSON.stringify(board)) {
						let seconds = parseInt((Date.now() - start_time) / 1000, 10),
							state = game_over && timer_started ? "over" : "game";
						if (!timer_started) seconds = 0;
						str.push(`${key}:${seconds}:${state}`);
					}
				});
				
				str.push(Fld.join(":"));
				str.push(PreFld.join(":"));
				// console.log( str.join("\n") );
				return str.join("\n");
		}
	},
	flagCount() {
		let flags = nMines - this.el.board.find(".flag").length;
		let i = this.el.countSpan.length;

		flags = flags.toString().padStart(i, "0");
		while (i--) {
			this.el.countSpan[i].className = "d"+ flags.charAt(i);
		}
	},
	timeCount() {
		let seconds = parseInt((Date.now() - start_time) / 1000, 10);
		let i = this.el.timerSpan.length;

		seconds = seconds.toString().padStart(i, "0");
		while (i--) {
			this.el.timerSpan[i].className = "d"+ seconds.charAt(i);
		}

		if (seconds > 1000 || game_over) return;
		this.timer = setTimeout(this.timeCount.bind(this), 1000);
	},
	setMine(xx, yy) {
		let ddy;
		let ddx;
		if (PreFld[yy][xx] < 0) return false;

		for (ddy = -1; ddy <= 1; ddy++) {
			for (ddx = -1; ddx <= 1; ddx++) {
				if ((xx + ddx >= 0) && (xx + ddx < board.x) && (yy + ddy >= 0) && (yy + ddy < board.y)) {
					if (PreFld[yy + ddy][xx + ddx] === 6) return false;
				}
			}
		}
		for (ddy = -1; ddy <= 1; ddy++) {
			for (ddx = -1; ddx <= 1; ddx++) {
				if ((xx + ddx >= 0) && (xx + ddx < board.x) && (yy + ddy >= 0) && (yy + ddy < board.y)) {
					if (PreFld[yy + ddy][xx + ddx] >= 0) PreFld[yy + ddy][xx + ddx]++;
				}
			}
		}
		PreFld[yy][xx] = -1;
		return true;
	},
	showFld(xxp, yyp) {
		let xx = xxp;
		let yy = yyp;

		if ((xx < 0) || (xx >= board.x) || (yy < 0) || (yy >= board.y)) return;
		if (Fld[yy][xx] != 0) return;
		Fld[yy][xx] = -1;
		
		this.el.blocks[board.x * yy + xx].className = "mines"+ PreFld[yy][xx];
		
		if (PreFld[yy][xx] != 0) return;
		for (let ddy = -1; ddy <= 1; ddy++) {
			for (let ddx = -1; ddx <= 1; ddx++) {
				if ((ddx != 0) || (ddy != 0)) this.showFld(xx + ddx, yy + ddy);
			}
		}
	},
	setOver() {
		for (let yy = 0; yy < board.y; yy++) {
			for (let xx = 0; xx < board.x; xx++) {
				if (PreFld[yy][xx] < 0) {
					if (Fld[yy][xx] == -1) this.el.blocks[board.x * yy + xx].className = "red";
					else this.el.blocks[board.x * yy + xx].className = "mine";  
				} else {
					if (Fld[yy][xx] == 1) this.el.blocks[board.x * yy + xx].className = "cross";
				}
			}
		}
		game_over = true;
		// update smiley
		this.el.smiley.addClass("sad");
	},
	checkOver() {
		for (let yy = 0; yy < board.y; yy++) {
			for (let xx = 0; xx < board.x; xx++) {
				if ((PreFld[yy][xx] < 0) && (Fld[yy][xx] != 1)) return;
				if ((PreFld[yy][xx] >= 0) && (Fld[yy][xx] != -1)) return;
			}
		}
		game_over = true;
		let end_time = Date.now();
		let ii = Math.floor((end_time - start_time) / 1000);

		// update smiley
		this.el.smiley.addClass("cool");
		// update seconds it took to solve
		this.el.solvedSpan.html(ii);
		// show dialog
		this.el.content.addClass("game-won");
	}
};

window.exports = mines;
