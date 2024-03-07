
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
		
		this.dispatch({ type: "new-game", arg: "20" });

		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		let Self = mines,
			nn,
			x, y,
			str,
			now,
			block;
		
		switch (event.type) {
			// custom events
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
					if (Fld[SelY][SelX]==0) {
						if (PreFld[SelY][SelX]>=0) {
							Self.showFld(SelX, SelY);
							Self.checkOver(); 
						} else {
							Fld[SelY][SelX]=-1;
							Self.setOver();
						}
					}
					// console.log( PreFld.join(":") );
					// console.log( Fld.join(":") );
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
				start_time = event.seconds || Date.now();
				// reset timer
				Self.timeCount();
				break;
			case "close-success-dialog":
				//neo.shell("win -dh success");
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
				Self.el.timerSpan.attr({ "class": "d0" });
				break;
			case "game-from-pgn":
				let pgn = event.pgn.split("\n"),
					[size, seconds] = pgn[0].split(":").map(i => +i);

				board = sizes[size];
				PreFld = pgn[1].split(":").map(row => row.split(",").map(i => +i));
				Fld = pgn[2].split(":").map(row => row.split(",").map(i => +i));
				console.log( PreFld );
				console.log( Fld );

				// draw board
				str = [];
				for (y=0; y<board.y; y++) {
					for (x=0; x<board.x; x++) {
						let cell = "mines0";
						if (PreFld[y][x] === 0) cell = "blank";
						else if (Fld[y][x] > 0) cell = `mines${Fld[y][x]}`;
						else if (Fld[y][x] < 0) cell = "red";
						else if (Fld[y][x] === 1) cell = "flag";
						else if (Fld[y][x] === 2) cell = "qmark";
						str.push(`<div Y="${y}" X="${x}" class="${cell}"></div>`);
					}
				}
				Self.el.board.html(str.join(""));
				// fast reference
				Self.el.blocks = mines.el.board.find("div");

				// update window dimensions
				window.width = board.w;
				window.height = board.h;

				// start timer
				timer_started = true;
				game_over = false;
				seconds = Date.now() - (seconds * 1000);
				Self.dispatch({ type: "start-timer", seconds });
				break;
			case "set-theme":
				Self.el.content.data({ theme: event.arg });
				break;
			case "output-pgn":
				str = [];

				Object.keys(sizes).map(key => {
					if (JSON.stringify(sizes[key]) === JSON.stringify(board)) {
						let seconds = parseInt((Date.now() - start_time) / 1000, 10);
						str.push(`${key}:${seconds}`);
					}
				});
				
				str.push(Fld.join(":"));
				str.push(PreFld.join(":"));
				console.log( str.join("\n") );
				break;
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

		if (seconds > 1000 || game_over) return;

		seconds = seconds.toString().padStart(i, "0");
		while (i--) {
			this.el.timerSpan[i].className = "d"+ seconds.charAt(i);
		}
		setTimeout(this.timeCount.bind(this), 1000);
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
		//neo.shell("win -ds success");
	}
};

window.exports = mines;
