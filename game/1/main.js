// phina.js をグローバル領域に展開
phina.globalize();

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 2400;
const MAIL_MAX = 16;
const PLAYER_SPEED = 5;

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

    let scene = DisplayScene({
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      backgroundColor: '#9ae28c',
    }).addChildTo(this);
    scene.backgroundColor = '#9ae28c';
    this.scene = scene;

    phina.display.PixelSprite('map').addChildTo(scene).setPosition(MAP_WIDTH / 2, MAP_HEIGHT / 2).setScale(20, 20);

    this.time = 0;

    let tweenerExecutioner = RectangleShape({
      width: 1,
      height: 1,
      alpha: 0,
    }).addChildTo(this).setPosition(-1, -1);
    this.tweenerExecutioner = tweenerExecutioner;

    let mailboxGroup = DisplayElement();
    this.mailboxGroup = mailboxGroup;
    for(let i=0; i<=3; i++) {
      for(let j=0; j<=3; j++) {
        let house;
        switch(Math.randint(0, 2)) {
          case 0:
            house = phina.display.PixelSprite('house_red');
            break;
          case 1:
            house = phina.display.PixelSprite('house_green');
            break;
          case 2:
            house = phina.display.PixelSprite('house_blue');
            break;
        }
        house.addChildTo(scene).setScale(3, 3).setPosition(this.hgx.span(i), this.hgy.span(j));
        let mailbox = Mailbox().addChildTo(mailboxGroup).setPosition(this.hgx.span(i) + 50, this.hgy.span(j) + 54);
      }
    }
    mailboxGroup.addChildTo(scene);

    let goatGroup = DisplayElement().addChildTo(scene);
    let goatCollisionGroup = DisplayElement().addChildTo(scene);
    let pair = Array.from({length: 100});

    let player = Player().addChildTo(scene);
    this.player = player;
    player.setPosition(this.posX(), this.posY());

    this.goatGroup = goatGroup;
    this.goatCollisionGroup = goatCollisionGroup;

    let balloon = phina.display.PixelSprite('balloon').addChildTo(scene);
    balloon.setScale(2, 2);
    this.balloon = balloon;

    this.currentMail = MAIL_MAX;

    this.notOpening = true;

    scene._render();
    let view = Sprite(scene.canvas).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
    this.view = view;

    let spawn = Tweener().wait(2000).call(function() {
      let x, y;
      switch(Math.randint(0, 3)) {
        case 0:
          x = Math.randint(view.x - SCREEN_WIDTH / 2 - 100, view.x + SCREEN_WIDTH / 2 + 100);
          y = player.y - 390;
          break;
        case 1:
          x = Math.randint(view.x - SCREEN_WIDTH / 2 - 100, view.x + SCREEN_WIDTH / 2 + 100);
          y = player.y + 390;
          break;
        case 2:
          x = player.x - 670;
          y = Math.randint(view.y - SCREEN_HEIGHT / 2 - 100, view.y + SCREEN_HEIGHT / 2 + 100);
          break;
        case 3:
          x = player.x + 670;
          y = Math.randint(view.y - SCREEN_HEIGHT / 2 - 100, view.y + SCREEN_HEIGHT / 2 + 100);
          break;
      }
      let goat = Goat().addChildTo(goatGroup).setPosition(x, y);
    }).setLoop(true).attachTo(tweenerExecutioner);

    let UILayer = DisplayScene({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: 'transparent',
    }).addChildTo(this);
    this.UILayer = UILayer;

    let UIGroup = DisplayElement().addChildTo(UILayer);
    this.UIGroup = UIGroup;
    let mailmanHead = phina.display.PixelSprite('mailman_head').addChildTo(UIGroup).setPosition(25, 25).setScale(3, 3);
    this.mailmanHead = mailmanHead;
    let healthBar = phina.display.PixelSprite('health', 54, 20).addChildTo(UIGroup).setPosition(105, 25).setScale(2, 2);
    this.healthBar = healthBar;
    let barAnimation = FrameAnimation('health_ss').attachTo(healthBar);
    this.barAnimation = barAnimation;
    let mails = phina.display.PixelSprite('mails').addChildTo(UIGroup).setPosition(50, 90).setScale(2, 2);
    this.mails = mails;
    let counter = Label({
      text: `x${this.currentMail}`,
      x: 142,
      y: 84,
      fontSize: 45,
      fontFamily: 'TheStrongGamer',
    }).addChildTo(UIGroup);
    this.counter = counter;
    let base = phina.display.PixelSprite('base').addChildTo(UIGroup).setPosition(270, 80).setScale(3, 3);
    let guideArrow = phina.display.PixelSprite('arrow').addChildTo(UIGroup).setPosition(270, 80).setScale(3, 3);
    this.guideArrow = guideArrow;
    /*
    this.angle = Label({
      text: 'waiting...',
      x: 210,
      y: 200,
      fontSize: 20,
    }).addChildTo(UIGroup);
    */

    UILayer._render();
    let UI = Sprite(UILayer.canvas).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
  },

  update: function(app) {
    let key = app.keyboard;
    let posX = this.posX;
    let posY = this.posY;
    let scene = this.scene;
    let tweenerExecutioner = this.tweenerExecutioner;
    let player = this.player;
    let playerCollision = this.playerCollision;
    let mailboxGroup = this.mailboxGroup;
    let goatGroup = this.goatGroup;
    let goatCollisionGroup = this.goatCollisionGroup;
    let balloon = this.balloon;
    let UIGroup = this.UIGroup;
    let UILayer = this.UILayer;
    let mailmanHead = this.mailmanHead;
    let healthBar = this.healthBar;
    let barAnimation = this.barAnimation;
    let mails = this.mails;
    let counter = this.counter;
    let guideArrow = this.guideArrow;

    scene._render();
    UILayer._render();

    this.time++;

    counter.text = `x${this.currentMail}`;

    if(player.x >= posX(-((MAP_WIDTH - SCREEN_WIDTH) / 2)) && player.x <= posX(((MAP_WIDTH - SCREEN_WIDTH) / 2))) {
      this.view.x = this.gridX.center() - (player.x - posX());
    } else if(player.x <= posX(-((MAP_WIDTH - SCREEN_WIDTH) / 2))) {
      this.view.x = this.gridX.center() + (MAP_WIDTH - SCREEN_WIDTH) / 2;
    } else if(player.x >= posX(((MAP_WIDTH - SCREEN_WIDTH) / 2))) {
      this.view.x = this.gridX.center() - (MAP_WIDTH - SCREEN_WIDTH) / 2;
    }
    if(player.y >= posY(-((MAP_HEIGHT - SCREEN_HEIGHT) / 2)) && player.y <= posY(((MAP_HEIGHT - SCREEN_HEIGHT) / 2))) {
      this.view.y = this.gridY.center() - (player.y - posY());
    } else if(player.y <= posY(-((MAP_HEIGHT - SCREEN_HEIGHT) / 2))) {
      this.view.y = this.gridY.center() + (MAP_HEIGHT - SCREEN_HEIGHT) / 2;
    } else if(player.y >= posY(((MAP_HEIGHT - SCREEN_HEIGHT) / 2))) {
      this.view.y = this.gridY.center() - (MAP_HEIGHT - SCREEN_HEIGHT) / 2;
    }

    mailboxGroup.children.some(function(m) {
      if(Math.randint(0, 9) === 0 && this.notOpening && !m.isDelivered) {
        this.notOpening = false;
        m.isOpening = true;
        balloon.setPosition(m.x, m.y - 68);
      }
    }, this);

    mailboxGroup.children.some(function(m) {
      if(Vector2.distance(Vector2(player.x, player.y), Vector2(m.x, m.y)) <= 80 && m.isOpening) {
        balloon.setScale(3, 3);
        balloon.y = m.y - 80;
        if(key.getKey('z')) {
          this.currentMail--;
          m.isOpening = false;
          m.isDelivered = true;
          if(this.currentMail === 0) {
            this.exit({
              deliveredMail: MAIL_MAX,
              healthRemain: player.health,
              elapseTime: this.time,
            });
          }
          this.notOpening = true;
        }
      } else if(m.isOpening) {
        balloon.setScale(2, 2);
        balloon.y = m.y - 68;
      }
    }, this);

    mailboxGroup.children.some(function(m) {
      if(m.isOpening) {
        let pToM = Math.radToDeg(Math.atan2(m.y - player.y, m.x - player.x));
        guideArrow.rotation = pToM + 180;
        /*
        this.angle.text = `atan2(player, mailbox) = ${pToM}`
        if(Math.abs(m.x - (SCREEN_WIDTH - this.view.x + ((MAP_WIDTH - SCREEN_WIDTH) / 2))) < SCREEN_WIDTH / 2) {
          if(Math.abs(m.y - (SCREEN_HEIGHT - this.view.y + ((MAP_HEIGHT - SCREEN_HEIGHT) / 2))) < SCREEN_HEIGHT / 2) {
            guideArrow.setPosition(-40, -40);
            return;
          }
        }
        if(Math.abs(m.y - (SCREEN_HEIGHT - this.view.y + ((MAP_HEIGHT - SCREEN_HEIGHT) / 2))) < SCREEN_HEIGHT / 2) {
          if(Math.abs(m.x - (SCREEN_WIDTH - this.view.x + ((MAP_WIDTH - SCREEN_WIDTH) / 2))) < SCREEN_WIDTH / 2) {
            guideArrow.setPosition(-40, -40);
            return;
          }
        }
        if(pToM >= Math.radToDeg(Math.atan2(SCREEN_HEIGHT / 2, -(SCREEN_WIDTH / 2)))
        || pToM <= Math.radToDeg(Math.atan2(-(SCREEN_HEIGHT / 2), -(SCREEN_WIDTH / 2)))) {
          guideArrow.x = 48;
        } else if(pToM >= Math.radToDeg(Math.atan2(-(SCREEN_HEIGHT / 2), SCREEN_WIDTH / 2))
        && pToM <= Math.radToDeg(Math.atan2(SCREEN_HEIGHT / 2, SCREEN_WIDTH / 2))) {
          guideArrow.x = 1232;
        }
        if(pToM >= Math.radToDeg(Math.atan2(-(SCREEN_HEIGHT / 2), -(SCREEN_WIDTH / 2)))
        && pToM <= Math.radToDeg(Math.atan2(-(SCREEN_HEIGHT / 2), SCREEN_WIDTH / 2))) {
          guideArrow.y = 48;
        } else if(pToM >= Math.radToDeg(Math.atan2(SCREEN_HEIGHT / 2, SCREEN_WIDTH / 2))
        && pToM <= Math.radToDeg(Math.atan2(SCREEN_HEIGHT / 2, -(SCREEN_WIDTH / 2)))) {
          guideArrow.y = 672;
        } else {
          let l = SCREEN_HEIGHT / 2 + ((m.y - player.y) * Math.abs(guideArrow.x - player.x) / Math.abs(m.x - player.x))
          if(l <= 48) {
            guideArrow.y = 48;
          } else if(l >= 672) {
            guideArrow.y = 672;
          }
          guideArrow.y = l;
        }
        */
      }
    }, this);

    goatGroup.children.some(function(g) {
      let playerVec = Vector2(player.x, player.y + 10);
      let goatVec = Vector2(g.x, g.y);
      let gToP = Vector2.sub(playerVec, goatVec);
      g.physical.velocity = gToP.normalize().mul(g.speed);
    });

    goatGroup.children.some(function(g) {
      if(Collision.testRectRect(g, player)) {
        if(!player.isInvincible) {
          player.isInvincible = true;
          player.health--;
          barAnimation.gotoAndPlay(String(player.health));
          if(player.health === 0) {
            this.exit({
              deliveredMail: MAIL_MAX - this.currentMail,
              healthRemain: 0,
              elapseTime: -1,
            });
          }
          player.alpha = 0.6;
          player.speed *= player.rate;
          player.tweener.wait(player.invincibleTime)
          .call(function() {
            player.isInvincible = false;
            player.alpha = 1;
            player.speed = PLAYER_SPEED;
          }).play();
        }
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
    }, this);

    //移動周り
    if(key.getKey('up')) {
      player.physical.velocity.y = -player.speed;
    }
    if(key.getKey('left')) {
      if(player.scaleX < 0) player.scaleX *= -1;
      player.physical.velocity.x = -player.speed;
    }
    if(key.getKey('down')) {
      player.physical.velocity.y = player.speed;
    }
    if(key.getKey('right')) {
      if(player.scaleX > 0) player.scaleX *= -1;
      player.physical.velocity.x = player.speed;
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
      player.physical.velocity.y = 0;
    }
    if(key.getKeyUp('left') || key.getKeyUp('right')) {
      player.physical.velocity.x = 0;
    }
    if(!key.getKey('up') && !key.getKey('left') && !key.getKey('down') && !key.getKey('right')) {
      player.animation.gotoAndPlay('stand');
    }

    if(key.getKey('backspace')) {
      this.exit({
        deliveredMail: MAIL_MAX,
        healthRemain: 1,
        elapseTime: 400000,
      });
    }
  }
});

phina.define('Player', {
  superClass: 'RectangleShape',
  init: function() {
    this.superInit({
      width: 18,
      height: 54,
      fill: 'transparent',
      stroke: 0,
    });

    this.image = phina.display.PixelSprite('mailman', 20, 30).addChildTo(this).setPosition(this.x, this.y - 16).setScale(3, 3);
    let animation = FrameAnimation('mailman_ss').attachTo(this.image);
    this.animation = animation;
    animation.gotoAndPlay('stand');

    this.health = 3;
    this.isInvincible = false;
    this.invincibleTime = 4000;
    this.speed = PLAYER_SPEED;
    this.rate = 1.2;
    this.direction = 0;
  },
});

phina.define('Goat', {
  superClass: 'RectangleShape',
  init: function() {
    this.superInit({
      width: 72,
      height: 40,
      fill: 'transparent',
      stroke: 0,
    });

    this.image = phina.display.PixelSprite('whitegoat').addChildTo(this).setPosition(this.x, this.y - 10).setScale(2, 2);
    let animation = FrameAnimation('goat_ss').attachTo(this.image);
    this.animation = animation;

    this.speed = Math.random() * 5.6;
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

phina.define('Mailbox', {
  superClass: 'phina.display.PixelSprite',
  init: function() {
    this.superInit('mailbox');

    this.setScale(2, 2);
    this.isOpening = false; //投函可能か否か
    this.isDelivered = false;
  },
});

phina.define('ResultScene', {
  superClass: 'DisplayScene',
  init: function(param) {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: '#68b1ca',
    });

    this.score = 0;

    this.score += param.deliveredMail * 2000;
    if(param.deliveredMail === MAIL_MAX) this.score += 10000;
    this.score += param.healthRemain * 3500;
    let m = Math.floor(param.elapseTime / 3600);
    let s = Math.floor((param.elapseTime - m * 3600) / 60);
    let ms = param.elapseTime - m * 3600 - s * 60;
    let timeBonus = (600000 - param.elapseTime) > 0 ? Math.floor((600000 - param.elapseTime) / 20) : 0;
    this.score += timeBonus;

    let header = Label({
      text: 'RESULT',
      x: SCREEN_WIDTH / 2,
      y: 60,
      fontSize: 80,
      fontFamily: 'SolidLinker',
    }).addChildTo(this);
    let scoreLabel1 = Label({
      text: 'Mails: 2000 x',
      x: 260,
      y: 200,
      fontSize: 60,
      fontFamily: 'ScoreDozer',
    }).addChildTo(this);
    let scoreLabel2 = Label({
      text: 'Health: 3500 x',
      x: 282,
      y: 300,
      fontSize: 60,
      fontFamily: 'ScoreDozer',
    }).addChildTo(this);
    let scoreLabel3 = Label({
      text: 'Time:  10m - ',
      x: 245,
      y: 400,
      fontSize: 60,
      fontFamily: 'ScoreDozer',
    }).addChildTo(this);
    let scoreLabel4 = Label({
      text: 'TOTAL:',
      x: 182,
      y: 640,
      fontSize: 70,
      fontFamily: 'ScoreDozer',
    }).addChildTo(this);

    header.tweener.wait(1000)
    .call(function() {
      Label({
        text: param.deliveredMail,
        x: 570,
        y: 200,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
        fill: 'red',
        align: 'right',
      }).addChildTo(this);
    }, this).wait(600)
    .call(function() {
      Label({
        text: '=',
        x: 600,
        y: 200,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
      }).addChildTo(this);
      Label({
        text: `${param.deliveredMail * 2000}`,
        x: 840,
        y: 200,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
        fill: 'red',
        align: 'right',
      }).addChildTo(this);
      if(param.deliveredMail === MAIL_MAX) {
        Label({
          text: '+ 10000',
          x: 1106,
          y: 200,
          fontSize: 60,
          fontFamily: 'ScoreDozer',
          fill: '#a1c54c',
          align: 'right',
        }).addChildTo(this);
        Label({
          text: `COMPLETE\nBONUS!`,
          x: 1120,
          y: 130,
          rotation: 20,
          fontSize: 30,
          fontFamily: 'TheStrongGamer',
          align: 'center',
        }).addChildTo(this);
      }
    }, this).wait(600)
    .call(function() {
      Label({
        text: param.healthRemain,
        x: 568,
        y: 300,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
        fill: 'red',
        align: 'right',
      }).addChildTo(this);
    }, this).wait(600)
    .call(function() {
      Label({
        text: '=',
        x: 600,
        y: 300,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
      }).addChildTo(this);
      Label({
        text: `${param.healthRemain * 3500}`,
        x: 840,
        y: 300,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
        fill: 'red',
        align: 'right',
      }).addChildTo(this);
    }, this).wait(600)
    .call(function() {
      Label({
        text: `${m}m${s}${ms}ms`,
        x: 755,
        y: 400,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
        fill: 'red',
        align: 'right',
      }).addChildTo(this);
    }, this).wait(600)
    .call(function() {
      Label({
        text: '→',
        x: 800,
        y: 400,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
      }).addChildTo(this);
      Label({
        text: `${timeBonus}`,
        x: 1050,
        y: 400,
        fontSize: 60,
        fontFamily: 'ScoreDozer',
        fill: 'red',
        align: 'right'
      }).addChildTo(this);
    }, this).play();
  }
});

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
        nextLabel: 'result',
      },
      {
        label: 'result',
        className: 'ResultScene',
        nextLabel: 'title',
      }
    ],
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    fps: 60,
    assets: ASSETS,
  });
  // アプリケーション実行
  app.run();
});
