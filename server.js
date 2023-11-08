const fs = require('fs');
const WebSocket = require('ws');
const os = require("os");

const keywords = {
    'ONE': ['http://top-fon.com/uploads/posts/2023-02/1675377658_top-fon-com-p-kareliya-fon-dlya-prezentatsii-176.jpg', 
            'http://vsegda-pomnim.com/uploads/posts/2022-04/1649125766_3-vsegda-pomnim-com-p-kareliya-vidi-prirodi-foto-3.jpg', 
            'http://vsegda-pomnim.com/uploads/posts/2022-04/1649117938_34-vsegda-pomnim-com-p-priroda-karelii-samie-krasivie-mesta-foto-34.jpg'],
    'TWO': ['http://russiaglorysongs.ru/wp-content/uploads/2021/10/img_4568-scaled-e1674233851316.jpg', 
            'http://ae01.alicdn.com/kf/HTB1VIUTNVXXXXX.aXXXq6xXFXXXI/-.jpg', 
            'http://img.freepik.com/free-photo/orthodoxy-monastery-at-bogolyubovo_1398-3856.jpg'],
    'THREE': ['http://img.freepik.com/free-photo/beautiful-butterfly-in-nature_23-2150445556.jpg', 
            'http://img.freepik.com/free-photo/beautiful-nature-landscape-with-river-and-vegetation_23-2150705844.jpg', 
            'https://images.pexels.com/photos/3250454/pexels-photo-3250454.jpeghttp://img.freepik.com/free-photo/beautiful-landscape-with-a-lake-in-a-forest-and-amazing-high-rocky-mountains_181624-7006.jpg'],    
  // Другие ключевые слова с соответствующими URL
};

let MAX_CONCURRENT_THREADS = 1; 
fs.readFile('config.txt', 'utf8', function(err, data) {
  if (!err) {
    MAX_CONCURRENT_THREADS = Number(data);
    
    console.log('Максимальное количество параллельных потоков установлено в ', MAX_CONCURRENT_THREADS);
  } else {
    console.error('Ошибка чтения файла конфигурации config.txt:', err);
  }
}); 

// ======================================================================================

const websocket_server = new WebSocket.Server({ port: 7777 });

function status(response) {  
  if (response.status >= 200 && response.status < 300) {  
    return Promise.resolve(response)  
  } else {  
    return Promise.reject(new Error(response.statusText))  
  }  
}

function buffer(response) {  
  return response.arrayBuffer();
}

function _arrayBufferToBase64( buffer ) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return btoa( binary );
}

websocket_server.on('connection', (web_socket) => {
  console.log('Соединение с клиентом установлено');
  
  web_socket.on('message', (message) => {
    console.log(`Принято новое сообщение: ${message}`);

    try {
      const input_message = JSON.parse(message);
      
      let output_message = {
        REQUEST : input_message.REQUEST,
        DATA    : input_message.DATA,
      };

      if (input_message.REQUEST == "KEYWORD") {
        output_message.ANSWER = keywords[input_message.DATA]
      } else if (input_message.REQUEST == "LINK") {

        fetch(input_message.DATA)  
        .then(status)  
        .then(buffer)  
        .then(function(data) { 
            output_message.ANSWER = _arrayBufferToBase64(data);

            web_socket.send(JSON.stringify(output_message));
          })
        .catch(function(error) {  
            console.log('Ошибка в запросе!', error);  
        });

        return;

      } else {
        output_message.ANSWER = "FAIL";
      }
      const urls = keywords[message];

      let threadCount = 0; 

      if (threadCount < MAX_CONCURRENT_THREADS) {
        threadCount++;
    
        web_socket.send(JSON.stringify(output_message));
    
        console.log(`Запущен новый поток. (${threadCount} из ${MAX_CONCURRENT_THREADS})`);
      } else {
        console.log('Достигнуто максимальное количество параллельных потоков!!!');
      }
    } catch  (err) {
      console.log(err);
    }
  });

  web_socket.on('close', () => {
    console.log('Связь с клиентом разорвана!');
  });
});

// ======================================================================================

console.log("Сервер на вебсокетах запущен на порту 7777");
console.log("Имя хоста:", os.hostname());