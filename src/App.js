import React,{Component} from 'react';
import socketIOClient from "socket.io-client";

class App extends Component{
  state = {
    gameField:{
      width:900,
      height:800
    },
    pos:null,
    keys : [],
    ball:null,
    rivalPos:null, // rakip pozisyon
    myScore:0,
    rivalScore:0,
    myCastle:null,
    rivalCastle:null,
  }
  componentDidMount(){
    this.io = socketIOClient('http://127.0.0.1:8000');

    this.io.on('playersConnected',data => {
      const {gameField} = this.state;
      this.setState({
        pos:data.pos,
        rivalPos:data.rivalPos,
        ball:data.ball,
      });
      // kale konumları
      this.setState({
        myCastle:{
          x:data.pos.x === 100 ? 0 : 900, // oyuncu solda başladıysa kale x ekseninde 0 noktasına, sağda başladıysa x ekseninde 900 noktasına
          y:gameField.height / 2 - 75,
          width:15,
          height:150
        },
        rivalCastle:{
          x:data.rivalPos.x === 100 ? 0 : 900, // oyuncu solda başladıysa kale x ekseninde 0 noktasına, sağda başladıysa x ekseninde 900 noktasına
          y:gameField.height / 2 - 75,
          width:15,
          height:150
        }
      })
    });

    this.io.on('moveRival',data => {
      this.setState({rivalPos:data});
    });
    this.io.on('moveBall',data => {
      this.setState({ball:data});
    });

    const fps = 60;
    setInterval(this.renderGame,1000/fps);

    // klavyeden tuşa basıldı
    document.onkeydown = (e) => {

      e = e || window.event;
      let {keys} = this.state;

      if (e.key === 'ArrowUp') {
        if(!keys.includes('up'))
          keys.push('up');
      }
      else if (e.key === 'ArrowDown') {
        if(!keys.includes('down'))
          keys.push('down');
      }
      else if (e.key === 'ArrowLeft') {
        if(!keys.includes('left'))
          keys.push('left');
      }
      else if (e.key === 'ArrowRight') {
        if(!keys.includes('right'))
          keys.push('right')
      }
      this.setState({keys});
    };
    // tuşdan çekildi
    document.onkeyup = (e) => {
      let {keys} = this.state;

      if(e.key === 'ArrowUp'){
        keys = keys.filter(key => key !== 'up');
      }else if(e.key === 'ArrowDown'){
        keys = keys.filter(key => key !== 'down');
      }else if(e.key === 'ArrowLeft'){
        keys = keys.filter(key => key !== 'left');
      }else if(e.key === 'ArrowRight'){
        keys = keys.filter(key => key !== 'right');
      }
      this.setState({keys});
    }
  }
  drawPlayer = () => {
    const {pos} = this.state;
    const ctx = this.refs.canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.r, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.fillStyle = "blue";
    ctx.fill();

    ctx.font = "20px Arial";
    ctx.fillText("Ben", pos.x - 40, pos.y - 25);
  }
  drawRival = () => {
    const {rivalPos} = this.state;
    const ctx = this.refs.canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(rivalPos.x, rivalPos.y, rivalPos.r, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.fillStyle = "darkgreen";
    ctx.fill();

    ctx.font = "20px Arial";
    ctx.fillText("Rakip", rivalPos.x - 40, rivalPos.y - 25);
  }
  drawGameField = () => {
    const {gameField,myScore,rivalScore} = this.state;
    const ctx = this.refs.canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(gameField.width / 2, 0);
    ctx.lineTo(gameField.width / 2, gameField.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(gameField.width/2,gameField.height/2, 100, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.font = "22px Arial";
    ctx.fillText("Ben " + myScore + " - " + rivalScore + " Rakip" , gameField.width / 2 - 70 , 20);
  }
  drawBall = () => {
    const {ball} = this.state;
    const ctx = this.refs.canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.fillStyle = ball.color;
    ctx.fill();
  }
  drawCastles = () => {
    const ctx = this.refs.canvas.getContext('2d');
    const {myCastle,rivalCastle} = this.state;

    ctx.beginPath();
    ctx.moveTo(myCastle.x, myCastle.y);
    ctx.lineTo(myCastle.x, myCastle.y + myCastle.height);
    ctx.lineWidth = myCastle.width;
    ctx.strokeStyle = "gray";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rivalCastle.x, rivalCastle.y);
    ctx.lineTo(rivalCastle.x, rivalCastle.y + myCastle.height);
    ctx.lineWidth = rivalCastle.width;
    ctx.strokeStyle = "gray";
    ctx.stroke();
  }
  moveBall = () => {
    let {ball,gameField,myCastle,rivalCastle} = this.state;

    // yatay hız 0'a ulaşmadıysa hareket ettir
    if (ball.hs !== 0) {
      ball.x += ball.hs;
      if(ball.lhs < 0)  // en son x ekseninde sola doğru vurulduysa hıza 0.25 ekle
        ball.hs += 0.25;
      else // x ekseninde sağa doğru vurulduysa hızdan 0.25 çıkar
        ball.hs -= 0.25;
    }
    // düşey hız 0'a ulaşmadıysa hareket ettir
    if (ball.vs !== 0) {
      ball.y += ball.vs;
      if (ball.lvs < 0) // en son y ekseninde yukarı doğru vurulduysa hıza 0.25 ekle
        ball.vs += 0.25;
      else // y ekseninde aşağı doğru vurulduysa hızdan 0.25 çıkar
        ball.vs -= 0.25;
    }

      if(myCastle.x === 0){ // soldaki kale benimse
        if(ball.x - ball.r <= myCastle.x + myCastle.width && ball.y - ball.r >= myCastle.y && ball.y + ball.r <= myCastle.y + myCastle.height) {  // top sol kaleye girdi
          this.setState({
            rivalScore: this.state.rivalScore + 1,
            pos: {x:100, y:100, r:20},
            rivalPos: {x:800, y:100, r:20},
            ball: {x:450, y:400, r:15, hs:0, vs:0, lhs:0, lvs:0, color:'gray'}
          })
        }
        else if(ball.x + ball.r >= rivalCastle.x - rivalCastle.width && ball.y - ball.r >= rivalCastle.y && ball.y + ball.r <= rivalCastle.y + rivalCastle.height) { // top sağ kaleye girdi
          this.setState({
            myScore: this.state.myScore + 1,
            pos: {x:100, y:100, r:20},
            rivalPos: {x:800, y:100, r:20},
            ball: {x:450, y:400, r:15, hs:0, vs:0, lhs:0, lvs:0, color:'gray'}
          })
        }
      }else{ // sağdaki kale benimse
        if(ball.x - ball.r <= rivalCastle.x + rivalCastle.width && ball.y - ball.r >= rivalCastle.y && ball.y + ball.r <= rivalCastle.y + rivalCastle.height) { // top sol kaleye girdi
          this.setState({
            myScore: this.state.myScore + 1,
            pos: {x:800, y:100, r:20},
            rivalPos: {x:100, y:100, r:20},
            ball: {x:450, y:400, r:15, hs:0, vs:0, lhs:0, lvs:0, color:'gray'}
          })
        }
        else if(ball.x + ball.r >= myCastle.x - myCastle.width && ball.y - ball.r >= myCastle.y && ball.y + ball.r <= myCastle.y + myCastle.height){ // top sağ kaleye girdi
          this.setState({
            rivalScore: this.state.rivalScore + 1,
            pos: {x:800, y:100, r:20},
            rivalPos: {x:100, y:100, r:20},
            ball: {x:450, y:400, r:15, hs:0, vs:0, lhs:0, lvs:0, color:'gray'}
          })
        }
      }

    // top yatay olarak oyun sahasını aştıysa hızını tersine çevir
    if (ball.x < ball.r){
      ball.hs = ball.hs * -1;
      ball.lhs = ball.lhs * -1;
      ball.x = ball.r;
    }else if(ball.x > gameField.width - ball.r){
      ball.hs = ball.hs * -1;
      ball.lhs = ball.lhs * -1;
      ball.x = gameField.width - ball.r;
    }
    // top düşey olarak oyun sahasını aştıysa hızını tersine çevir
    if (ball.y < ball.r){
      ball.vs = ball.vs * -1;
      ball.lvs = ball.lvs * -1;
      ball.y = ball.r;
    }else if(ball.y > gameField.height - ball.r){
      ball.vs = ball.vs * -1;
      ball.lvs = ball.lvs * -1;
      ball.y = gameField.height - ball.r;
    }

  }
  movePlayers = () => {
    let {keys,pos,gameField,ball} = this.state;
    const movSpeed = 5; // hareket hızı
    const combinationSpeed = 4; // iki tuş aynı anda basılı iken oluşan hız

    // kendini hareket ettir
    if(keys.includes('up')){
      if(keys.includes('right')){
        pos.x += combinationSpeed;
        pos.y -= combinationSpeed;
      }
      else if(keys.includes('left')){
        pos.x -= combinationSpeed;
        pos.y -= combinationSpeed;
      }else
        pos.y -= movSpeed;
    }else if(keys.includes('down')){
      if(keys.includes('right')){
        pos.x += combinationSpeed;
        pos.y += combinationSpeed;
      }
      else if(keys.includes('left')){
        pos.x -= combinationSpeed;
        pos.y += combinationSpeed;
      }else
        pos.y += movSpeed;
    }else if(keys.includes('left')){
      if(keys.includes('up')){
        pos.y -= combinationSpeed;
        pos.x -= combinationSpeed;
      }
      else if(keys.includes('down')){
        pos.y += combinationSpeed;
        pos.x -= combinationSpeed;
      }else
        pos.x -= movSpeed;
    }else if(keys.includes('right')){
      if(keys.includes('up')){
        pos.y -= combinationSpeed;
        pos.x += combinationSpeed;
      }
      else if(keys.includes('down')){
        pos.y += combinationSpeed;
        pos.x += combinationSpeed;
      }else
        pos.x += movSpeed;
    }

    // karakterler oyun alanını taşıyor mu
    if(pos.x > gameField.width - pos.r)
      pos.x = gameField.width - pos.r;
    if(pos.x < pos.r)
      pos.x = pos.r;
    if(pos.y > gameField.height - pos.r)
      pos.y = gameField.height - pos.r;
    if(pos.y < pos.r)
      pos.y = pos.r;

    // karakterim veya rakip top ile temas etti mi
    const speed = 13, hvSpeed = 11; // yatay-düşey hız, çapraz gidişteki hız
    if (pos.x + pos.r >= ball.x - ball.r && pos.x + pos.r <= ball.x + ball.r && pos.y + pos.r >= ball.y + ball.r && pos.y - pos.r <= ball.y - ball.r){
        // oyuncunun sağ tarafı topa çarparsa
        ball.hs = speed;
        ball.lhs = speed;
        this.io.emit('moveBall',ball);
    } else if (pos.x + pos.r >= ball.x - ball.r && pos.x + pos.r <= ball.x + ball.r && pos.y + pos.r <= ball.y + ball.r && pos.y + pos.r >= ball.y - ball.r){
        // oyuncunun sağ alt kısmı topa çarparsa
        ball.hs = hvSpeed;
        ball.vs = hvSpeed;
        ball.lhs = hvSpeed;
        ball.lvs = hvSpeed;
        this.io.emit('moveBall',ball);
    } else if (pos.x + pos.r >= ball.x - ball.r && pos.x + pos.r <= ball.x + ball.r && pos.y - pos.r >= ball.y - ball.r && pos.y - pos.r <= ball.y + ball.r){
        // oyuncu sağ üst kısmı topa çarparsa
        ball.hs = hvSpeed;
        ball.vs = hvSpeed * -1;
        ball.lhs = hvSpeed;
        ball.lvs = hvSpeed * -1;
        this.io.emit('moveBall',ball);
    } else if (pos.x - pos.r <= ball.x + ball.r && pos.x - pos.r >= ball.x - ball.r && pos.y - pos.r <= ball.y - ball.r && pos.y + pos.r >= ball.y + ball.r){
        // oyuncunun sol tarafı topa çarparsa
        ball.hs = speed * -1;
        ball.lhs = speed * -1;
        this.io.emit('moveBall',ball);
    } else if(pos.x - pos.r <= ball.x + ball.r && pos.x - pos.r >= ball.x - ball.r && pos.y + pos.r >= ball.y - ball.r && pos.y + pos.r <= ball.y + ball.r){
        // oyuncunun sol alt tarafı topa çarparsa
        ball.hs = hvSpeed * -1;
        ball.vs = hvSpeed;
        ball.lhs = hvSpeed * -1;
        ball.lvs = hvSpeed;
        this.io.emit('moveBall',ball);
    } else if(pos.x - pos.r <= ball.x + ball.r && pos.x - pos.r >= ball.x - ball.r && pos.y - pos.r <= ball.y + ball.r && pos.y - pos.r >= ball.y - ball.r){
        // oyuncunun sol üst tarafı topa çarparsa
        ball.hs = hvSpeed * -1;
        ball.vs = hvSpeed * -1;
        ball.lhs = hvSpeed * -1;
        ball.lvs = hvSpeed * -1;
        this.io.emit('moveBall',ball);
    }else if(pos.y - pos.r <= ball.y + ball.r && pos.y - pos.r >= ball.y - ball.r && pos.x + pos.r >= ball.x + ball.r && pos.x - pos.r <= ball.x - ball.r){
        // oyuncunun üst kısmı topa çarparsa
        ball.vs = speed * -1;
        ball.lvs = speed * -1;
        this.io.emit('moveBall',ball);
    }else if(pos.y + pos.r >= ball.y - ball.r && pos.y + pos.r <= ball.y + ball.r && pos.x + pos.r >= ball.x + ball.r && pos.x - pos.r <= ball.x - ball.r){
        // oyuncunun alt kısmı topa çarparsa
        ball.vs = speed;
        ball.lvs = speed;
        this.io.emit('moveBall',ball);
    }
    // NOT = renderGame fonksiyonu belirli aralıklarla tekrar tekrar çalıştığı için setState ile tetiklemeye gerek kalmıyor - fonksiyon içinde ball ve pos değerleri değiştirmek yeterli oluyor
    this.io.emit('moveRival',pos);
  }
  renderGame = () => {
    const {gameField,rivalPos,pos,ball,myCastle,rivalCastle} = this.state;

    if(pos === null || rivalPos === null || ball === null || myCastle === null || rivalCastle === null)
      return;

    const ctx = this.refs.canvas.getContext('2d');
    ctx.clearRect(0, 0, gameField.width, gameField.height);

    this.drawGameField();
    this.drawBall();
    this.drawPlayer();
    this.drawRival();
    this.drawCastles();
    this.movePlayers();
    this.moveBall();
  }

  render(){
    const {rivalPos,gameField} = this.state;
    return(
      <div id="page-wrapper">
        {
          rivalPos === null
          ? <div style={{display:'flex',justifyContent:'center',alignItems:'center',width:'100%',height:'100vh'}}> <h1>Rakip Bekleniyor...</h1> </div>
          : <canvas ref="canvas" style={{backgroundColor:'lightgreen'}} width={gameField.width} height={gameField.height}/>
        }

      </div>
    )
  }
}
export default App;
