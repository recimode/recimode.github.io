// phina.js をグローバル領域に展開
phina.globalize();

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 2400;
const LETTER_MAX = 50;
const PLAYER_SPEED = 5;
const GOAT_SPEED = 3.5;

import {ASSETS} from './assets.js';

//Special Thanks: Negiwine氏, axion014氏
//https://runstant.com/Negiwine/projects/d0d82f25
phina.define('phina.display.PixelSprite', {
  superClass: 'phina.display.Sprite',
  init: function(image, width, height){
    this.superInit(image, width, height);
  },

  draw: function(canvas){
    canvas.save();                        //canvasの状態をスタックに保存
    canvas.imageSmoothingEnabled = false; //ここがミソ　拡大時の補完を無効に
    this.superMethod('draw', canvas);     //スーパークラスのdrawメソッド呼び出し
    canvas.restore();                     //他に影響が出ないように状態を戻す
  },
});

phina.define('TitleScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    this.backgroundColor = '#80c791';
    this.title = Label({
      text: 'Delivery Game',
      x: this.gridX.center(),
      y: 200,
      fontSize: 40,
      fill: '#342609',
      fontFamily: 'SolidLinker',
    }).addChildTo(this);
    this.guide = Label({
      text: 'Press Enter Key',
      x: this.gridX.center(),
      y: 600,
      fontSize: 40,
      fill: '#342609',
      fontFamily: 'SolidLinker',
    }).addChildTo(this);
  },

  update: function(app) {
    let key = app.keyboard;

    if(key.getKey('enter')) {
      this.exit();
    }
  }
});

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    //原点中心にオブジェクトを配置するためのグリッドと簡略化のための関数
    let posX = function(x) {
      let mapGridX = Grid({
        width: MAP_WIDTH,
        columns: MAP_WIDTH,
      });

      return mapGridX.center(x);
    }
    let posY = function(y) {
      let mapGridY = Grid({
        width: MAP_HEIGHT,
        columns: MAP_HEIGHT,
      });

      return mapGridY.center(y);
    }
    this.posX = posX;
    this.posY = posY;

    //家及びポストを配置するためのグリッド
    let houseGridX = Grid({
      width: 2000,
      columns: 3,
      offset: 200,
    });
    let houseGridY = Grid({
      width: 2000,
      columns: 3,
      offset: 200,
    });
    this.hgx = houseGridX;
    this.hgy = houseGridY;

    // 背景色を指定
    this.backgroundColor = 'black';

    let capp = CanvasApp({
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      append: false,
    });
    this.capp = capp;
    console.log(capp.currentScene);
    console.log(this);
    let scene = capp.currentScene;
    scene.backgroundColor = '#9ae28c';
    //scene._render();
    this.scene = scene;

    let tweenerExecutioner = RectangleShape({
      width: 1,
      height: 1,
      alpha: 0,
    }).addChildTo(this).setPosition(-1, -1);
    this.tweenerExecutioner = tweenerExecutioner;

    let inboxGroup = DisplayElement();
    this.inboxGroup = inboxGroup;
    for(let i=0; i<=3; i++) {
      for(let j=0; j<=3; j++) {
        let house = RectangleShape({
          width: 120,
          height: 80,
          fill: 'blue',
          x: this.hgx.span(i),
          y: this.hgy.span(j),
        }).addChildTo(scene);
        //house.render(house.canvas);
        let inbox = Inbox().addChildTo(inboxGroup).setPosition(this.hgx.span(i) + 30, this.hgy.span(j) + 30);
        //inbox.render(inbox.canvas);
      }
    }
    inboxGroup.addChildTo(scene);

    let goatGroup = DisplayElement().addChildTo(scene);
    let goatCollisionGroup = DisplayElement().addChildTo(scene);
    let pair = Array.from({length: 100});
    (0).times(function(i) {
      let x = Math.randint(0, MAP_WIDTH);
      let y = Math.randint(0, MAP_HEIGHT)
      let goat = Goat().addChildTo(goatGroup).setPosition(x, y);
      let goatCollision = GoatCollision().addChildTo(goatCollisionGroup).setPosition(x, y);
      pair[i] = [goat, goatCollision];
    });

    let player = Player().addChildTo(scene);
    this.player = player;
    player.setPosition(this.posX(), this.posY());
    let playerCollision = PlayerCollision().addChildTo(scene);
    this.playerCollision = playerCollision;
    playerCollision.setPosition(this.posX(), this.posY() + 16);

    let UIGroup = DisplayElement().addChildTo(scene);
    this.UIGroup = UIGroup;
    let mailmanHead = phina.display.PixelSprite('mailman_head').addChildTo(UIGroup).setPosition(player.x - 615, player.y - 335).setScale(3, 3);
    this.mailmanHead = mailmanHead;
    let healthBar = phina.display.PixelSprite('health', 54, 20).addChildTo(UIGroup).setPosition(player.x - 535, player.y - 335).setScale(2, 2);
    this.healthBar = healthBar;
    let barAnimation = FrameAnimation('health_ss').attachTo(healthBar);
    this.barAnimation = barAnimation;
    let letters = phina.display.PixelSprite('letters').addChildTo(UIGroup).setPosition(player.x - 590, player.y - 270).setScale(2, 2);
    this.letters = letters;

    let spawn = Tweener().wait(3000).call(function() {
      let x, y;
      switch(Math.randint(0, 3)) {
        case 0:
          x = Math.randint(0, SCREEN_WIDTH);
          y = -30;
          break;
        case 1:
          x = Math.randint(0, SCREEN_WIDTH);
          y = SCREEN_HEIGHT + 30;
          break;
        case 2:
          x = -30;
          y = Math.randint(0, SCREEN_HEIGHT);
          break;
        case 3:
          x = SCREEN_WIDTH + 30;
          y = Math.randint(0, SCREEN_HEIGHT);
          break;
      }
      let goat = Goat().addChildTo(goatGroup).setPosition(x, y);
      let goatCollision = GoatCollision().addChildTo(goatCollisionGroup).setPosition(x, y);
      //pair[i] = [goat, goatCollision];
    }).setLoop(true).attachTo(tweenerExecutioner);

    this.goatGroup = goatGroup;
    this.goatCollisionGroup = goatCollisionGroup;

    let currentLetter = LETTER_MAX;
    this.currentLetter = currentLetter;

    this.notOpening = true;

    capp._update();
    capp._draw();
    let camera = Sprite(scene.canvas).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
    this.camera = camera;

    let test = RectangleShape({
      width: 10,
      height: 10,
      fill: 'red',
    }).addChildTo(scene).setPosition(posX(), posY());
    test.tweener.wait(1000)
    .call(function() {
      console.log('aoaoa');
    }).play();

    //DEBUG
    /*
    let letterGauge = Label({
      text: `currentLetter: ${currentLetter}`,
      x: player.x - 560,
      y: player.y - 350,
      fill: 'black',
      fontSize: 20,
    }).addChildTo(scene);
    this.letterGauge = letterGauge;
    */
  },

  update: function(app) {
    let key = app.keyboard;
    let posX = this.posX;
    let posY = this.posY;
    let capp = this.capp;
    let scene = this.scene;
    let tweenerExecutioner = this.tweenerExecutioner;
    let player = this.player;
    let playerCollision = this.playerCollision;
    let inboxGroup = this.inboxGroup;
    let goatGroup = this.goatGroup;
    let goatCollisionGroup = this.goatCollisionGroup;
    let currentLetter = this.currentLetter;
    let UIGroup = this.UIGroup;
    let mailmanHead = this.mailmanHead;
    let healthBar = this.healthBar;
    let barAnimation = this.barAnimation;
    let letters = this.letters;
    let self = this;

    capp._update();
    capp._draw();
    //player.draw(player.canvas)
    //this.scene._render();
    /*let camera = Sprite(scene.canvas).addChildTo(this).setPosition(this.camera.x, this.camera.y);
    this.camera.remove();
    this.camera = camera;*/
    if(player.x >= posX(-((MAP_WIDTH - SCREEN_WIDTH)/2)) && player.x <= posX(((MAP_WIDTH - SCREEN_WIDTH)/2))) {
      this.camera.x = this.gridX.center() - (player.x - posX());
    } else if(player.x <= posX(-((MAP_WIDTH - SCREEN_WIDTH)/2))) {
      this.camera.x = this.gridX.center() + (MAP_WIDTH - SCREEN_WIDTH)/2;
    } else if(player.x >= posX(((MAP_WIDTH - SCREEN_WIDTH)/2))) {
      this.camera.x = this.gridX.center() - (MAP_WIDTH - SCREEN_WIDTH)/2;
    }
    if(player.y >= posY(-((MAP_HEIGHT - SCREEN_HEIGHT)/2)) && player.y <= posY(((MAP_HEIGHT - SCREEN_HEIGHT)/2))) {
      this.camera.y = this.gridY.center() - (player.y - posY());
    } else if(player.y <= posY(-((MAP_HEIGHT - SCREEN_HEIGHT)/2))) {
      this.camera.y = this.gridY.center() + (MAP_HEIGHT - SCREEN_HEIGHT)/2;
    } else if(player.y >= posY(((MAP_HEIGHT - SCREEN_HEIGHT)/2))) {
      this.camera.y = this.gridY.center() - (MAP_HEIGHT - SCREEN_HEIGHT)/2;
    }

    inboxGroup.children.some(function(i) {
      if(Math.randint(0, 9) === 0 && this.notOpening && !i.isDelivered) {
        this.notOpening = false;
        i.isOpening = true;
        i.setScale(2, 2);
      }
    }, this);

    inboxGroup.children.some(function(i) {
      if(Vector2.distance(Vector2(player.x, player.y), Vector2(i.x, i.y)) <= 80 && i.isOpening) {
        if(key.getKey('z')) {
          currentLetter--;
          i.isOpening = false;
          i.isDelivered = true;
          i.setScale(1, 1);
          this.notOpening = true;
        }
      }
    }, this);

    goatGroup.children.some(function(g) {
      let playerVec = Vector2(player.x, player.y);
      let goatVec = Vector2(g.x, g.y);
      let gtop = Vector2.sub(playerVec, goatVec);
      g.physical.velocity = gtop.normalize().mul(g.speed);
    });
    goatCollisionGroup.children.some(function(gc) {
      let playerVec = Vector2(player.x, player.y);
      let goatCollisionVec = Vector2(gc.x, gc.y);
      let gctop = Vector2.sub(playerVec, goatCollisionVec);
      gc.physical.velocity = gctop.normalize().mul(gc.speed);
    });

    goatCollisionGroup.children.some(function(gc) {
      if(Collision.testRectRect(gc, playerCollision)) {
        if(!player.isInvincible) {
          player.isInvincible = true;
          player.health--;
          barAnimation.gotoAndPlay(String(player.health));
          player.alpha = 0.6;
          player.speed = playerCollision.speed *= player.rate;
          tweenerExecutioner.tweener.wait(player.invincibleTime)
          .call(function() {
            player.isInvincible = false;
            player.alpha = 1;
            player.speed = playerCollision.speed = PLAYER_SPEED;
          }).play();
        }
        //console.log('hit!');
      }
      /* 後で余裕があれば
      goatCollisionGroup.children.some(function(gc_) {
        if(gc !== gc_) {
          if(Collision.testRectRect(gc, gc_)) {
            if(Math.abs(gc.x - gc_.x) < gc.width) {
              gc.x = gc.x < gc_.x ? gc_.x - gc.width : gc_.x + gc.width;
            }
            if(Math.abs(gc.y - gc_.y) < gc.height) {
              gc.y = gc.y < gc_.y ? gc_.y - gc.height : gc_.y + gc.height;
            }
          }
        }
      })
      */
    });

    //移動周り
    if(key.getKey('up')) {
      player.physical.velocity.y = playerCollision.physical.velocity.y = -player.speed;
      if(player.y >= posY(-((MAP_HEIGHT - SCREEN_HEIGHT)/2))) {
        UIGroup.children.some(function(u) {
          u.physical.velocity.y = -player.speed;
        });
      } else {
        UIGroup.children.some(function(u) {
          u.physical.velocity.y = 0;
          mailmanHead.y = 25;
          healthBar.y = 25;
          letters.y = 90;
        });
      }
    }
    if(key.getKey('left')) {
      if(player.scaleX < 0) player.scaleX *= -1;
      player.physical.velocity.x = playerCollision.physical.velocity.x = -player.speed;
      if(player.x >= posX(-((MAP_WIDTH - SCREEN_WIDTH)/2))) {
        UIGroup.children.some(function(u) {
          u.physical.velocity.x = -player.speed;
        });
      } else {
        UIGroup.children.some(function(u) {
          u.physical.velocity.x = 0;
          mailmanHead.x = 25;
          healthBar.x = 105;
          letters.x = 50;
        });
      }
    }
    if(key.getKey('down')) {
      player.physical.velocity.y = playerCollision.physical.velocity.y = player.speed;
      if(player.y <= posY(((MAP_HEIGHT - SCREEN_HEIGHT)/2))) {
        UIGroup.children.some(function(u) {
          u.physical.velocity.y = player.speed;
        });
      } else {
        UIGroup.children.some(function(u) {
          u.physical.velocity.y = 0;
          mailmanHead.y = MAP_HEIGHT - SCREEN_HEIGHT + 25;
          healthBar.y = MAP_HEIGHT - SCREEN_HEIGHT + 25;
          letters.y = MAP_HEIGHT - SCREEN_HEIGHT + 90;
        });
      }
    }
    if(key.getKey('right')) {
      if(player.scaleX > 0) player.scaleX *= -1;
      player.physical.velocity.x = playerCollision.physical.velocity.x = player.speed;
      if(player.x <= posX(((MAP_WIDTH - SCREEN_WIDTH)/2))) {
        UIGroup.children.some(function(u) {
          u.physical.velocity.x = player.speed;
        });
      } else {
        UIGroup.children.some(function(u) {
          u.physical.velocity.x = 0;
          mailmanHead.x = MAP_WIDTH - SCREEN_WIDTH + 25;
          healthBar.x = MAP_WIDTH - SCREEN_WIDTH + 105;
          letters.x = MAP_WIDTH - SCREEN_WIDTH + 50;
        });
      }
    }
    if(key.getKeyDown('up')) {
      if(player.direction === 0) {
        player.animation.gotoAndPlay('left');
      } else {
        player.animation.gotoAndPlay('right');
      }
    }
    if(key.getKeyDown('left')) {
      player.direction = 0;
      player.animation.gotoAndPlay('left');
    }
    if(key.getKeyDown('down')) {
      if(player.direction === 0) {
        player.animation.gotoAndPlay('left');
      } else {
        player.animation.gotoAndPlay('right');
      }
    }
    if(key.getKeyDown('right')) {
      player.direction = 1;
      player.animation.gotoAndPlay('right');
    }
    if(key.getKeyUp('up') || key.getKeyUp('down')) {
      player.physical.velocity.y = playerCollision.physical.velocity.y = 0;
      UIGroup.children.some(function(u) {
        u.physical.velocity.y = 0;
      });
    }
    if(key.getKeyUp('left') || key.getKeyUp('right')) {
      player.physical.velocity.x = playerCollision.physical.velocity.x = 0;
      UIGroup.children.some(function(u) {
        u.physical.velocity.x = 0;
      });
    }
    if(!key.getKey('up') && !key.getKey('left') && !key.getKey('down') && !key.getKey('right')) {
      player.animation.gotoAndPlay('stand');
    }
    //DEBUG
    /*
    let letterGauge = this.letterGauge;
    letterGauge.text = `currentLetter: ${currentLetter}`;
    letterGauge.setPosition(player.x - 560, player.y - 350);
    */
  }
});

phina.define('Player', {
  superClass: 'phina.display.PixelSprite',
  init: function() {
    this.superInit('mailman', 20, 30);

    this.health = 3;
    this.isInvincible = false;
    this.invincibleTime = 5000;
    this.speed = PLAYER_SPEED;
    this.rate = 1.5;
    this.direction = 0;

    this.setScale(3, 3);
    let animation = FrameAnimation('mailman_ss').attachTo(this);
    this.animation = animation;
    animation.gotoAndPlay('stand');
  },
});

phina.define('PlayerCollision', {
  superClass: 'RectangleShape',
  init: function() {
    this.superInit({
      width: 18,
      height: 54,
      fill: 'red',
      //alpha: 0,
    });

    this.speed = PLAYER_SPEED;
  }
})

phina.define('Goat', {
  superClass: 'phina.display.PixelSprite',
  init: function() {
    this.superInit('whitegoat', 42, 30);

    this.setScale(2, 2);
    let animation = FrameAnimation('goat_ss').attachTo(this);
    this.animation = animation;
    this.speed = GOAT_SPEED;
  },

  update: function() {
    let animation = this.animation;

    if(this.physical.velocity.x < 0) {
      if(this.scaleX < 0) this.scaleX *= -1;
      animation.gotoAndPlay('left');
    } else {
      if(this.scaleX > 0) this.scaleX *= -1;
      animation.gotoAndPlay('right');
    }
  }
});

phina.define('GoatCollision', {
  superClass: 'RectangleShape',
  init: function() {
    this.superInit({
      width: 78,
      height: 45,
      fill: 'red',
      //alpha: 0,
    });

    this.speed = GOAT_SPEED;
  }
});

phina.define('Inbox', {
  superClass: 'phina.display.PixelSprite',
  init: function() {
    this.superInit('mailbox');

    this.isOpening = false; //投函可能か否か
    this.isDelivered = false;
  },
})

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'main', // メインシーンから開始する
    scenes: [
      {
        label: 'title',
        className: 'TitleScene',
        nextLabel: 'main',
      },
      {
        label: 'main',
        className: 'MainScene',
        nextLabel: 'title',
      },
    ],
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    fps: 60,
    assets: ASSETS,
  });
  // アプリケーション実行
  app.run();
});
