class WindowModal {
    #elem;
    #template = '<div class="modal-backdrop"><div class="modal-content modal-scrollable"><div class="modal-header"><div class="modal-title">{{title}}</div><span class="modal-btn-close" title="Закрыть">×</span></div><div class="modal-body">{{content}}</div>{{footer}}</div></div>';
    #templateFooter = '<div class="modal-footer">{{buttons}}</div>';
    #templateBtn = '<button type="button" class="{{class}}" data-action={{action}}>{{text}}</button>';
    #eventShowModal = new Event('show.win.modal', { bubbles: true });
    #eventHideModal = new Event('hide.win.modal', { bubbles: true });
    #disposed = false;
  
    constructor(options = []) {
      this.#elem = document.createElement('div');
      this.#elem.classList.add('window-modal');
      let html = this.#template.replace('{{title}}', options.title || 'Новое окно');
      html = html.replace('{{content}}', options.content || '');
      const buttons = (options.footerButtons || []).map((item) => {
        let btn = this.#templateBtn.replace('{{class}}', item.class);
        btn = btn.replace('{{action}}', item.action);
        return btn.replace('{{text}}', item.text);
      });
      const footer = buttons.length ? this.#templateFooter.replace('{{buttons}}', buttons.join('')) : '';
      html = html.replace('{{footer}}', footer);
      this.#elem.innerHTML = html;
      document.body.append(this.#elem);
      this.#elem.addEventListener('click', this.#handlerCloseModal.bind(this));
    }
  
    #handlerCloseModal(e) {
      if (e.target.closest('.modal-btn-close') || e.target.classList.contains('modal-backdrop')) {
        this.hide();
      }
    }
  
    show() {
      if (this.#disposed) {
        return;
      }
      this.#elem.classList.add('modal-show');
      const scrollbarWidth = Math.abs(window.innerWidth - document.documentElement.clientWidth);
      if (window.innerWidth > document.body.clientWidth + scrollbarWidth) {
        return;
      }
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      this.#elem.dispatchEvent(this.#eventShowModal);
    }
  
    hide() {
      this.#elem.classList.remove('modal-show');
      this.#elem.dispatchEvent(this.#eventHideModal);
      document.body.style.paddingRight = '';
      document.body.offsetHeight;
      this.#elem.addEventListener('transitionend', () => {
        document.body.style.overflow = '';
      }, { once: true });
    }
  
    dispose() {
      this.#elem.remove(this.#elem);
      this.#elem.removeEventListener('click', this.#handlerCloseModal);
      this.#disposed = true;
    }
  
    setBody(html) {
      this.#elem.querySelector('.modal-body').innerHTML = html;
    }
  
    setTitle(text) {
      this.#elem.querySelector('.modal-title').innerHTML = text;
    }
  }
// ======================================================================================

function hash(str) {
  var hash = 0,  i, chr;
  
  if (str.length === 0) return hash;

      for (i = 0; i < str.length; i++) {
          chr = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0;
      }
  return hash;
}

// ======================================================================================

function create_list_element(link) {
  const hash_string = hash(link);

  const list_element = document.createElement('li');
  list_element.style.marginBottom = '10px';
  list_element.id = "li_"+hash_string;            

  stored_url = localStorage.getItem(hash_string);

  if (stored_url != null) {
    const a_link = document.createElement('a');
    a_link.href = hash_string;
    a_link.innerHTML = link;
    list_element.appendChild(a_link);
  } else {
      list_element.innerHTML = link;

      const download_button = document.createElement('button');
      download_button.className = "input_button";
      download_button.innerHTML = 'Нажмите, чтобы загрузить контент...';
      list_element.appendChild(download_button);

      download_button.addEventListener('click', 
        function() { get_link_data(link); }
      );
  };
  
  return list_element;
}

// ======================================================================================

const web_socket = new WebSocket('ws://localhost:7777');

web_socket.onopen = function() {
  console.log('Соединение с сервером установлено');
}

web_socket.onmessage = function(message) {
  const input_message = JSON.parse(message.data);

  if (input_message.ANSWER === "FAIL") {
    alert('Ошибка передачи данных!!!') ;

  } else if (input_message.REQUEST == 'KEYWORD') {

    try {
      let list_of_URLs = document.getElementById('menu');

      list_of_URLs.innerHTML = '';

      input_message.ANSWER.forEach(
        (link) => {
          list_of_URLs.appendChild(create_list_element(link));
        }
      );
    } catch (err) {
      alert(`Ключевое слово: ${input_message.DATA} не найдено!`)
    }
  } else if (input_message.REQUEST == 'LINK') {
    hash_string = hash(input_message.DATA);

    localStorage.setItem(hash_string, input_message.ANSWER);
    
    let list_element = document.getElementById('li_' + hash_string);
    list_element.remove();

    document.getElementById('menu').appendChild(create_list_element(input_message.DATA));
  }  
};

web_socket.onclose = function(message) {
  console.log('Соединение с сервером разорвано!');
};

// ======================================================================================

function get_or_update_URL_list() {
  const message = {
    REQUEST : 'KEYWORD',
    DATA    : document.getElementById('input_keyword').value
  }
  
  web_socket.send(JSON.stringify(message));
}

function get_link_data(link) {
  const message = {
    REQUEST : 'LINK',
    DATA    : link
  }
  
  web_socket.send(JSON.stringify(message));
}


// function get_URLs_from_LocalStorage() {
//    try {
//        const list_of_URLs = JSON.parse(localStorage.getItem('list_of_URLs'));

//        let html_list = "";

//        if (list_of_URLs.length > 0) {
//
//                list_of_URLs.forEach(element => {
//                html_list += '<li><a href="'+element[0]+'">'+element[1]+'</a></li>';
//            });

//            document.getElementById('menu').innerHTML = html_list;
//        }        
//    } catch (err) { 
//        const target_link = 'Если бы у бабки было то, что есть у дедки, то ... во рту б росли грибы!';
//        const target_string = '<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime iste quasi saepe excepturi porro quod odit, in magni dolores laboriosam, tempore provident quos ducimus facilis veniam quam blanditiis, vel cupiditate.</p>';

//        localStorage.setItem(hash(target_string), target_string); // сюда пихаем контент
//        localStorage.setItem('list_of_URLs', JSON.stringify([[hash(target_string), target_string]]))
//    }
// }

// =====================================================================================

menu.onclick = function(event) {
    if (event.target.nodeName != 'A') return;
  
    const href = event.target.getAttribute('href');

    try {
      const win_modal = new WindowModal({
        title: "Содержимое репозитария.",
        content: '<img src="data:image/png;base64,'+localStorage.getItem(href)+'" width="950"/>'
      });

      win_modal.show();
    } catch {
      alert('Данный URL не сохранен в LocalStorage!!!');
    }

  return false;
};

// ====================================================================================

// get_URLs_from_LocalStorage();