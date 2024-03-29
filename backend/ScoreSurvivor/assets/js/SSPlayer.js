var Character = new Phaser.Class({ // whole is image game object

  Extends: Phaser.GameObjects.Image,

  initialize: function Character (scene, x, y, framePrefix){
  	let temp = framePrefix.split('_');
    this.characterType = temp[0] + '_' + temp[1]; // name char + _ + gun type
    this.motion = temp[3]; // fire or reload

    // start pos
    this.startX = x;
    this.startY = y;

    // change animation
    this.framePrefix = framePrefix; // can change due to turn direction
    this.currentFrame = 1;

    this.velo = GET_TILE_SIZE()*5;

    this.direction = temp[2]; // move top, down, ...

    Phaser.GameObjects.Image.call(this, scene, this.startX, this.startY, 'characters', this.framePrefix + (this.currentFrame.toString().padStart(2, '0')) + '.png'); // init same size

    scene.physics.add.existing(this).body.setOffset(0, 0).setSize(44, 44);

    scene.physics.add.collider(this, layer);

    // name label
    this.banner = null;

    this.currentScore = 0;
		this.scale = 16*0.8*layer.scale/(this.width > this.height ? this.width : this.height);
  },

  switchDirection: function(direction){
  	if(this.direction == direction){
  		return; // no change direction
  	}

  	// switch direction
  	this.direction = direction;
  	this.framePrefix = this.characterType + '_' + this.direction + '_' + this.motion + '_';
    this.frame = this.texture.get(this.framePrefix + (this.currentFrame.toString().padStart(2, '0')) + '.png');
  },
});

export class Player extends Character {
	constructor(scene, x, y, framePrefix, id){
		super(scene, x, y, framePrefix);

    this.player_id = id;
    this.velo = GET_TILE_SIZE()/10;

		this.isAnswerQuestion = false;

    this.banner = scene.rexUI.add.label({
      x: x,
      y: y-this.displayHeight,

      text: scene.add.text(0, 0, id, {
        font: GET_TILE_SIZE()/2 + 'px monospace',
        color: '#dfdfff'
      })
    }).layout().setDepth(100);

    this.score = 0;
	}

  move(direction){
    // if(isUp){
   //    player.body.setVelocityY(velo);
    // } else {
   //    player.body.setVelocityX(velo);
    // }
  //  player.switchDirection(direction);
    this.x += allPossibleMove[direction][0] * this.velo;
    this.y += allPossibleMove[direction][1] * this.velo;

    this.switchDirection(direction);

    this.banner.x = this.x;
    this.banner.y = this.y-this.displayHeight;

    // check if the same room with client
    if(!debug){
      if(this.player_id != player.id){
        let playerTileX = map.worldToTileX(this.x), playerTileY = map.worldToTileY(this.y),
          room = dungeon.getRoomAt(playerTileX, playerTileY);

        this.room_id = room.id;

        if(SSScene.activeRoom.id && this.room_id == SSScene.activeRoom.id){
          this.setAlpha(1);
          this.banner.setAlpha(1);
        } else {
          this.setAlpha(SSScene.discoveredRoom.map(room=>room.id).includes(this.room_id) ? 0.5 : 0);
          this.banner.setAlpha(SSScene.discoveredRoom.map(room=>room.id).includes(this.room_id) ? 0.5 : 0);
        }
      }
    }
  }
}

export class Zombie extends Character {
	constructor(scene, x, y, framePrefix, id, path=[]){
		super(scene, x, y, framePrefix);

    this.zombie_id = id;
    this.isReachDestination = false;

    this.startPoint = { x: x, y: y };
    this.startTime = 0;
    this.path = path;
    this.velo = GET_TILE_SIZE()/10;

    scene.time.delayedCall(100, this.move, [], this); // call delay animation
	}

  move(){
    if(!this.path.length){
      return;
    }
    // move
    // this.body.setVelocityY(allPossibleMove[this.path[0]][1] * this.velo);
    // this.body.setVelocityX(allPossibleMove[this.path[0]][0] * this.velo);
    this.x += allPossibleMove[this.path[0]][0] * this.velo;
    this.y += allPossibleMove[this.path[0]][1] * this.velo;

    this.switchDirection(this.path[0]);

    // if move enough for one square
    if(this.startTime == 10 || Phaser.Math.Distance.Between(this.startPoint.x, this.startPoint.y, this.x, this.y) >= GET_TILE_SIZE()){
      this.path.shift();

      if(this.path.length == 0){
        this.isReachDestination = true;
      }
      this.startPoint.x = this.x;
      this.startPoint.y = this.y;
      this.startTime = 0;
    }

    this.startTime++;

    // check if the same room with client
    if(!debug){
      let zombieTileX = map.worldToTileX(this.x), zombieTileY = map.worldToTileY(this.y),
        room = dungeon.getRoomAt(zombieTileX, zombieTileY);

      this.room_id = room.id;

      if(this.room_id == SSScene.activeRoom.id){
        this.setAlpha(1);
      } else {
        this.setAlpha(SSScene.discoveredRoom.map(room=>room.id).includes(this.room_id) ? 0.5 : 0);
      }
    }

    // if not reach continue loop
    if(!this.isReachDestination){
      SSScene.time.delayedCall(20, this.move, [], this); // call delay animation
    } else {
      // this.body.setVelocityY(0);
      // this.body.setVelocityX(0);
      this.switchDirection('down');
    }
  }
}