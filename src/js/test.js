
let Test = {
	init(APP) {
		// return;

		// setTimeout(() => APP.el.board.find(`div:nth(50)`).trigger("click"), 100);
		// setTimeout(() => APP.el.board.find(`div:nth(51)`).trigger("click"), 120);
		// setTimeout(() => APP.dispatch({ type: "output-pgn" }), 200);

		setTimeout(() => {
			let pgn = `10:5
0,0,0,0,0,0,0,0,0:0,0,0,0,0,0,0,0,0:0,0,0,0,0,0,0,0,0:0,0,0,0,-1,0,0,0,0:0,0,0,0,0,0,0,0,0:0,0,0,0,0,0,0,0,0:0,0,0,0,-1,0,0,0,0:0,0,0,0,0,0,0,0,0:0,0,0,0,0,0,0,0,0
1,-1,1,0,0,0,0,0,0:1,1,1,1,1,1,0,0,0:0,0,0,1,-1,2,1,2,1:0,0,0,1,1,2,-1,2,-1:0,0,0,0,1,2,2,2,1:1,1,0,1,2,-1,2,1,0:-1,2,1,2,-1,3,-1,2,1:1,2,-1,2,1,2,2,-1,1:0,1,1,1,0,0,1,1,1`;


			APP.dispatch({ type: "game-from-pgn", pgn });
		}, 200);



		// setTimeout(() => karaqu.shell("win -a"), 500);
	}
};
