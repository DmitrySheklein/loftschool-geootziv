import './styles/styles.scss';
import renderReview from './../modal-review.hbs';

let comments = [
/*     {
        id: '45.55, 33.33',
        list: [
            {
                name: 'svetlana',
                address: 'Шоколадница',
                date: '13.12.2015',
                text: 'Очень хорошее место!'
            },
            {
                name: 'Сергей Мелюков',
                address: 'Красный куб',
                date: '12.12.2015',
                text: ' Ужасное место! Кругом зомби!!!!'
            },
            {
                name: 'Сергей',
                address: 'Красный куб',
                date: '12.12.2012',
                text: 'Кругом зомби!!!!'
            }            
        ] 
    } */
/* 
    {
        id: 1234,
        list: [    {
            name: 'svetlana',
            address: 'Шоколадница',
            date: '13.12.2015',
            text: 'Очень хорошее место!'
            }   ]
    } */
 
]
let modal = document.getElementById('modal');
let modalCloseBtn = document.querySelector('.modal__close')
let modalSaveReview = modal.querySelector('.btn.btn--save')

const init = () => {
    const map = new ymaps.Map('map', {
        center: [55.751291, 37.628372],
        zoom: 15,
        behaviors: ['default', 'scrollZoom']
    }, {
        searchControlProvider: 'yandex#search'
    });

    map.events.add('click', e => {
        let coords = e.get('coords');
        let position = e.get('position');
        let coordToAdress = ymaps.geocode(coords);
        let id = Date.now();

        coordToAdress.then(res=> {
            let obj = res.geoObjects.get(0);
            let lastAddress = obj.properties.get('name');
           
            // Создаём макет содержимого.
            let MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
                '<i class="map-pin fa fa-map-marker" aria-hidden="true"></i>'
            )            
            const placemark = new ymaps.Placemark(coords, {}, {
                // Необходимо указать данный тип макета.
                iconImageHref: '',
                // Размеры метки.
                iconImageSize: [29, 50],
                // Смещение левого верхнего угла иконки относительно
                // её "ножки" (точки привязки).
                iconImageOffset: [-14, -25],                
                iconLayout: 'default#imageWithContent',
                iconContentLayout: MyIconContentLayout
            })
            
            map.geoObjects.add(placemark);

            addToComments(id, lastAddress)
            showModal(position, lastAddress, generateComments(id), id)

        })
    })

    map.geoObjects.events.add('click', e => {
        console.log('marked click');               
    })
}

ymaps.ready(init)

function showModal(position, titleName, comments, id) {
    modal.classList.add('active')
    let form = modal.querySelector('#add-review');

    form.dataset.id = id;
    let title = modal.querySelector('.modal__title');

    title.innerHTML = titleName;

    let commentList = modal.querySelector('.modal__comments-list');

    commentList.innerHTML = comments;

    let positionLeft = position[0];
    let positionTop = position[1];
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let modalWidth = modal.offsetWidth;
    let modalHeight = modal.offsetHeight;

/*     console.log(windowWidth, windowHeight);
    console.log(modalWidth, modalHeight); */
    
    modal.style.left = `${positionLeft}px`
    modal.style.top = `${positionTop}px`

    if (positionLeft + modalWidth > windowWidth) {
        modal.style.left = `${positionLeft-modalWidth}px`;        
    }

    if (positionTop + modalHeight > windowHeight) {
        modal.style.top = `${windowHeight - modalHeight}px`
    }
}

function hideModal() {
    let title = modal.querySelector('.modal__title');
    let commentList = modal.querySelector('.modal__comments-list');

    commentList.innerHTML = '';
    title.innerHTML = '';    
    modal.classList.remove('active')
}

modalCloseBtn.addEventListener('click', hideModal)

function addToComments(id, address) {
    comments.push({
        id,
        address,
        list: []
    })

    console.log(comments);
    
}

function generateComments(id) {  
    let comment = comments.find(item => {
        return item.id === Number(id);
    })
    
    let modalHtml = renderReview({ list: comment.list }) 
    
    if (!modalHtml) {
        modalHtml = 'Отзывов ещё нет'
    }
    
    return modalHtml;
}

modalSaveReview.addEventListener('click', e => {
    e.preventDefault()
    let btn = e.target;
    let form = btn.parentNode;
    let id = form.dataset.id;
    let name = form.name.value;
    let address = form.address.value;
    let text = form.text.value;
    let date = `12.12.12`;

    console.log(typeof id,name,address,text);
    
    let comment = comments.find(item => {
        return item.id === Number(id);
    })

    comment.list.push({
        name, address, date, text
    })

    console.log(comment);    

    let commentList = modal.querySelector('.modal__comments-list');

    commentList.innerHTML =  generateComments(id);
})