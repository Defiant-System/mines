
const sizes = {
	"10": {w: 260, h: 261, x: 9, y: 9},
	"20": {w: 442, h: 443, x: 16, y: 16},
	"99": {w: 807, h: 443, x: 30, y: 16}
};
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
		this.el.board = window.find(".game-board");
		this.el.smiley = window.find(".icon-smiley");
		this.el.timerSpan = window.find(".timer span");
		this.el.countSpan = window.find(".mine-count span");
		this.el.solvedSpan = window.find(".seconds-solved");
		
		this.dispatch({type: "new-game", arg: "20"});
	},
	dispatch(event) {
		let self = mines,
			cmd = typeof(event) === "object" ? event.type : event,
			nn,
			x, y,
			str,
			now,
			block;
		
		switch (cmd) {
			// custom events
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
					self.dispatch("start-timer");
				}

				if (event.button <= 1 && (!event.ctrlKey && !event.metaKey)) {
					if (Fld[SelX][SelY]==0) {
						if (PreFld[SelX][SelY]>=0) {
							self.showFld(SelX, SelY);
							self.checkOver(); 
						} else {
							Fld[SelX][SelY]=-1;
							self.setOver();
						}
					}
				} else {
					if (Fld[SelX][SelY] >= 0) {
						Fld[SelX][SelY]++;
						Fld[SelX][SelY] %= 3;
						if (Fld[SelX][SelY] == 0) {
							self.el.blocks[board.x * SelY + SelX].className = "blank";
						}
						if (Fld[SelX][SelY] == 1) {
							self.el.blocks[board.x * SelY + SelX].className = "flag";
						}
						if (Fld[SelX][SelY] == 2) {
							self.el.blocks[board.x * SelY + SelX].className = "qmark";
						}
						self.flagCount();
						self.checkOver();
					}
				}
				break;
			case "start-timer":
				now = new Date();
				start_time = now.getTime() / 1000;
				// reset timer
				self.timeCount();
				break;
			case "close-success-dialog":
				//neo.shell("win -dh success");
				break;
			case "new-game":
				nMines = +event.arg || nMines
				board = sizes[nMines];

				PreFld = new Array(board.x);
				Fld = new Array(board.x);
				for (nn=0; nn < board.x; nn++) PreFld[nn] = new Array(board.y);
				for (nn=0; nn < board.x; nn++) Fld[nn] = new Array(board.y);

				// draw board
				str = "";
				for (y=0; y<board.y; y++) {
					for (x=0; x<board.x; x++) {
						PreFld[x][y] = 0;
						Fld[x][y] = 0;
						str += `<div Y="${y}" X="${x}" class="blank"></div>`;
					}
				}
				self.el.board.html(str);
				// fast reference
				self.el.blocks = mines.el.board.find("div");

				// update window dimensions
				window.width = board.w;
				window.height = board.h;

				nn = 0;
				while (nn < nMines) {
					x = Math.round(Math.random() * 1000) % board.x;
					y = Math.round(Math.random() * 1000) % board.y;
					if (self.setMine(x, y)) nn++;
				}
				// update smiley
				self.el.smiley.removeClass("sad cool");

				// update flag counter
				self.flagCount();

				timer_started = false;
				game_over = "new_board";
				self.el.timerSpan.attr({"class": "d0"});
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
		let now = new Date();
		let seconds = parseInt((now.getTime() / 1000) - start_time, 10);
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
		if (PreFld[xx][yy] < 0) return false;

		for (let ddx = -1; ddx <= 1; ddx++) {
			for (ddy = -1; ddy <= 1; ddy++) {
				if ((xx+ddx >= 0) && (xx + ddx < board.x) && (yy + ddy >= 0) && (yy + ddy < board.x)) {
					if (PreFld[xx + ddx][yy + ddy] === 6) return false;
				}
			}
		}
		for (ddx = -1; ddx <= 1; ddx++) {
			for (ddy = -1; ddy <= 1; ddy++) {
				if ((xx + ddx >= 0) && (xx + ddx < board.x) && (yy + ddy >= 0) && (yy + ddy < board.y)) {
					if (PreFld[xx + ddx][yy + ddy] >= 0) PreFld[xx + ddx][yy + ddy]++;
				}
			}
		}
		PreFld[xx][yy] = -1;
		return true;
	},
	showFld(xxp, yyp) {
		let xx = xxp;
		let yy = yyp;

		if ((xx < 0) || (xx >= board.x) || (yy < 0) || (yy >= board.y)) return;
		if (Fld[xx][yy] != 0) return;
		Fld[xx][yy] = -1;
		
		this.el.blocks[board.x * yy + xx].className = "mines"+ PreFld[xx][yy];
		
		if (PreFld[xx][yy] != 0) return;
		for (let ddx = -1; ddx <= 1; ddx++) {
			for (let ddy = -1; ddy <= 1; ddy++) {
				if ((ddx != 0) || (ddy != 0)) this.showFld(xx + ddx, yy + ddy);
			}
		}
	},
	setOver() {
		for (let xx = 0; xx < board.x; xx++) {
			for (let yy = 0; yy < board.y; yy++) {
				if (PreFld[xx][yy] < 0) {
					if (Fld[xx][yy] == -1) this.el.blocks[board.x * yy + xx].className = "red";
					else this.el.blocks[board.x * yy + xx].className = "mine";  
				} else {
					if (Fld[xx][yy] == 1) this.el.blocks[board.x * yy + xx].className = "cross";
				}
			}
		}
		game_over = true;
		// update smiley
		this.el.smiley.addClass("sad");
	},
	checkOver() {
		for (let xx = 0; xx < board.x; xx++) {
			for (let yy = 0; yy < board.y; yy++) {
				if ((PreFld[xx][yy] < 0) && (Fld[xx][yy] != 1)) return;
				if ((PreFld[xx][yy] >= 0) && (Fld[xx][yy] != -1)) return;
			}
		}
		game_over = true;
		let now = new Date();
		let end_time = now.getTime() / 1000;
		let ii = Math.floor(end_time - start_time);

		// update smiley
		this.el.smiley.addClass("cool");
		// update seconds it took to solve
		this.el.solvedSpan.html(ii);
		// show dialog
		//neo.shell("win -ds success");
	}
};

window.exports = mines;
