import './styles/styles.scss';
import renderReview from './../modal-review.hbs';

let comments = [];
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

    const clusterer = new ymaps.Clusterer({
        /**
         * Через кластеризатор можно указать только стили кластеров,
         * стили для меток нужно назначать каждой метке отдельно.
         * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/option.presetStorage.xml
         */
        preset: 'islands#invertedVioletClusterIcons',
        /**
         * Ставим true, если хотим кластеризовать только точки с одинаковыми координатами.
         */
        groupByCoordinates: false,
        /**
         * Опции кластеров указываем в кластеризаторе с префиксом "cluster".
         * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ClusterPlacemark.xml
         */
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
    })
    let geoObjects = [];

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
                '<i class="map-pin active fa fa-map-marker" aria-hidden="true"></i>'
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

            placemark.properties.set('test-id', id);
            placemark.properties.set('type', 'geoMarker');
            placemark.properties.set('address', lastAddress);
            
            map.geoObjects.add(placemark);
            // geoObjects.push(placemark)

            addToComments(id, lastAddress)
            showModal(id, position, lastAddress)
        })
    })

    map.geoObjects.events.add('click', e => {
        let marker = e.get('target');
        let type = marker.properties.get('type');
        let id = marker.properties.get('test-id');
        let position = e.get('position');
        let lastAddress = marker.properties.get('address');
 
        if (type === 'geoMarker') {
            showModal( id, position, lastAddress)
        }            
    })
    
/*     clusterer.add(geoObjects);
    map.geoObjects.add(clusterer);    */ 
}

ymaps.ready(init)

function showModal( id, position, titleName) {
    modal.classList.add('active')
    let form = modal.querySelector('#add-review');

    form.dataset.id = id;
    let title = modal.querySelector('.modal__title');

    title.innerHTML = titleName;

    let commentList = modal.querySelector('.modal__comments-list');

    commentList.innerHTML = generateComments(id);

    let positionLeft = position[0];
    let positionTop = position[1];
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let modalWidth = modal.offsetWidth;
    let modalHeight = modal.offsetHeight;
    let pinSize = {
        width: 29,
        height: 50
    }    

    modal.style.left = `${positionLeft + pinSize.width / 2}px`
    modal.style.top = `${positionTop + pinSize.height / 2}px`

    if (positionLeft + modalWidth > windowWidth) {
        modal.style.left = `${positionLeft - modalWidth}px`;        
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
    modal.classList.remove('active');

    let inputs = modal.querySelectorAll('.modal-review__input');

    for (let input of inputs) {
        input.classList.remove('required')
        input.value = '';
    }    
}

modalCloseBtn.addEventListener('click', hideModal)

function addToComments(id, address) {
    comments.push({
        id,
        address,
        list: []
    })    
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
    let dateNow = new Date();
    let date = `${dateNow.getDate()}.${dateNow.getUTCMonth()}.${dateNow.getFullYear()}`;
    let error = false;

    let inputs = form.querySelectorAll('.modal-review__input');

    for (let input of inputs) {
        if (input.value === '' && input.required) {
            input.classList.add('required')
            error = true
        } else {
            input.classList.remove('required')
        }
    }
    
    if (!error) {
        let comment = comments.find(item => {
            return item.id === Number(id);
        })
    
        comment.list.push({
            name, address, date, text
        })
    
        let commentList = modal.querySelector('.modal__comments-list');
    
        commentList.innerHTML = generateComments(id);
    
        form.reset()
    }
})