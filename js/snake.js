class DOMManipulator {

    find(selector, container = document) {
        let found = container.querySelectorAll(selector);
        return found.length === 1 ? found[0] : found;
    }
}

class Grid extends DOMManipulator{
    constructor({boxSize, borderSize, gridCount, gridCssCellClass, gridContainer}) {
        super();

        this.boxSize = boxSize; 
        this.borderSize = borderSize;
        this.gridCount = gridCount;
        this.gridCssCellClass = gridCssCellClass;
        this.gridContainer = this.find(gridContainer);

        this.#_init();
    }

    #_init() {
        this.gridContainer.style.width = this.gridContainer.style.height = (this.boxSize * this.gridCount) + 'px';

        for (let index = 0; index < this.gridCount; index++) {
            this.gridContainer.append(this.#_createRow(index))
        }
    }

    #_createRow(row) {
        let fragment = new DocumentFragment();
        for (let index = 0; index < this.gridCount; index++) {
            fragment.append(this.#_createCell(row, index))
        }
        return fragment;
    }

    #_createCell(row, cell) { 
        const div = document.createElement('div');
        div.classList.add(this.gridCssCellClass);
        div.setAttribute('data-cell', cell);
        div.setAttribute('data-row', row);
        div.style.width = div.style.height = (this.boxSize - this.borderSize) + 'px';
        return div;
    }

}

class Snake extends Grid {

    #_snake = null;
    #_processGame = null;
    #_score = 0;
    #_food = null;
    #_controlsForm = this.find('#snake-controls-form');
    #_startBtn = this.find('#snake-start-game');
    #_endBtn = this.find('#snake-end-game');
    #_messageBox = this.find('#snake-message');
    #_scoreContainer = this.find('#snake-score');

    constructor({boxSize, borderSize,gridCount, foodUrl}) {
        super({boxSize, borderSize, gridCount, gridCssCellClass: 'snake-cell', gridContainer: '#snake-container'});

        this.noWallMode = true;
        this.speed = 500;
        this.direction = 'left';
        this.foodUrl = foodUrl;

        this.#_init()
    }

    startGame(){
        this.#_snake = this.#_createSnake(Math.floor(this.gridCount / 2), Math.floor(this.gridCount / 2), 5 );
        this.#_food = this.#_generateBoxForEat();
        this.speed = this.#_controlsForm.speed.value;
        this.direction = 'left'
        this.#_messageBox.textContent = 'Welcome to Snake!';
        this.#_endBtn.style = 'display: block';
        this.#_startBtn.style = 'display: none';
        this.noWallMode = this.#_controlsForm.wall.value;
        this.#_processGame = setInterval(() => {

            let { cell, row } = this.#_noWallMode(this.#_snake[0]);

            switch(this.direction) {
                case 'left': {
                    this.#_snake.unshift({
                        cell: cell -1,
                        row
                    })
                } break;

                case 'up': {
                    this.#_snake.unshift({
                        cell,
                        row: row - 1
                    })
                } break;

                case 'right': {
                    this.#_snake.unshift({
                        cell: cell + 1,
                        row
                    })
                } break;

                case 'down': {
                    this.#_snake.unshift({
                        cell,
                        row: row +1
                    })
                } break;
            }

            this.#_clear();
            this.#_update();

        }, this.speed)

    }

    endGame(){
        this.#_messageBox.textContent = 'Game over!';
        this.#_endBtn.style = 'display: none';
        this.#_startBtn.style = 'display: block';
        this.#_food.firstElementChild.remove();
        this.#_score = 0;

        clearTimeout(this.#_processGame);

        setTimeout(() => {
            this.#_clear()
        }, 1000)
    }

    #_init(){
        document.addEventListener('keydown', (event) => this.#_updateDirection(event));
        this.#_startBtn.addEventListener('click', (event) => this.startGame(event));
        this.#_endBtn.addEventListener('click', (event) => this.endGame(event));
    }

    #_updateDirection(keyboardEvent) {
        
        if(keyboardEvent.keyCode == 37 && this.direction != 'right') this.direction = 'left';
        else if(keyboardEvent.keyCode == 38 && this.direction != 'down') this.direction = 'up';
        else if(keyboardEvent.keyCode == 39 && this.direction != 'left') this.direction = 'right';
        else if(keyboardEvent.keyCode == 40 && this.direction != 'up') this.direction = 'down';
    
    }

    #_createSnake(startCell, startRow, count) {
        let arr = [];

        for (let index = 0; index < count; index++) {
            arr.push({
                cell: startCell + index,
                row: startRow,
            })
        }

        return arr;
    }

    #_generateBoxForEat() {
        const food = new Image();
        food.src = this.foodUrl;
        let foodDirection;

        do {
            foodDirection = {
                cell: getRandomInt(0, this.gridCount),
                row: getRandomInt(0, this.gridCount),
            }
        } while (this.#_snake.some( e => foodDirection.cell === e.cell && foodDirection.row === e.row));

        foodDirection = this.#_findByCoords(foodDirection.cell, foodDirection.row );

        foodDirection.append(food);

        return foodDirection;
    }

    #_clear() {

        let cells = this.find('.snake', this.gridContainer);

        for(const cell of cells) {
            cell.className = this.gridCssCellClass;
        }
    }

    #_update() {

        this.#_checkOnEated(this.#_food)
        this.#_checkOnTailCrush();

        for(const [index, snakePart] of this.#_snake.entries()) {
            let cell = this.#_findByCoords(snakePart.cell, snakePart.row);

            if(index == 0) {
                cell.classList?.add('snake-head', 'snake');
            } else {
                cell.classList?.add('snake-body', 'snake');
            }
        }

        this.#_scoreContainer.firstElementChild.textContent = this.#_score;
    }

    #_findByCoords(cell, row) {
        return this.find(`[data-cell="${cell}"][data-row="${row}"]`, this.gridContainer)
    }

    #_checkOnEated(food) {

        if(this.#_findSnakeHead() === food) {
            ++this.#_score;
            food.innerHTML = '';
            this.#_food = this.#_generateBoxForEat();
            return;
        } else {
            this.#_snake.pop();
        }

    }

    #_checkOnTailCrush() {

        for(let i = 1; i < this.#_snake.length; i++){

            if(this.#_snake[0].cell === this.#_snake[i].cell
                && this.#_snake[0].row === this.#_snake[i].row) {
                this.endGame();
                this.#_findSnakeHead().classList.add('crashed')
            }

        }
    }

    #_noWallMode(head) {

        let { cell , row } = head;

            if (this.direction == "left" && cell == 0) {
                if(this.noWallMode === 'true') {
                    cell = this.gridCount;
                } else {
                    this.endGame();
                }
            } else if (this.direction == "right" && cell == this.gridCount - 1) {

                if(this.noWallMode === 'true') {
                    cell = -1;
                } else {
                    this.endGame();
                }
                
            } else if (this.direction == "up" && row == 0) {
                
                if(this.noWallMode === 'true') {
                    row = this.gridCount;
                } else {
                    this.endGame();
                }
                
            } else if (this.direction == "down" && row == this.gridCount - 1) {
                
                if(this.noWallMode === 'true') {
                    row = -1;
                } else {
                    this.endGame();
                }
            }
        
        return { cell , row };
    }

    #_findSnakeHead() {
        return this.#_findByCoords(this.#_snake[0].cell,this.#_snake[0].row);
    }
}


new Snake({
    boxSize: 32,
    borderSize: 2,
    gridCount: 14,
    foodUrl: './img/apple.png'
})

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}