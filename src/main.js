import './styles/styles.scss';
import renderReview from './../modal-review.hbs';
import { modalDnD } from './modalDnD.js';

let comments = localStorage.getItem('comments') ? JSON.parse(localStorage.getItem('comments') ) : [];
let modal = document.getElementById('modal');
let modalCloseBtn = document.querySelector('.modal__close')
let modalSaveReview = modal.querySelector('.btn.btn--save')
let lastAddress;
let lastCoords;
let position;

const init = () => {
    const map = new ymaps.Map('map', {
        center: [55.751291, 37.628372],
        zoom: 15,
        behaviors: ['default', 'scrollZoom']
    }, {
        searchControlProvider: 'yandex#search'
    });

    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>',
        {
            build: function() {
                customItemContentLayout.superclass.build.call(this);

                let parent = this.getParentElement();
                let link = parent.querySelector('.baloon-link');

                link.addEventListener('click', this.onLinkClick.bind(link))
            },
            clear: function () {
                let parent = this.getParentElement();
                let link = parent.querySelector('.baloon-link');

                link.removeEventListener('click', this.onLinkClick.bind(link))
                customItemContentLayout.superclass.clear.call(this);
            },

            onLinkClick: function () {
                let id = this.dataset.id;
                let title = this.dataset.title;

                clusterer.balloon.close()
                showModal(id, position, title);

            }			
        }            
    );    
    const clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedOrangeClusterIcons',
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,        
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5,     
        groupByCoordinates: false,

        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
    });
    const iconLayoutActive = ymaps.templateLayoutFactory.createClass(
        '<i class="map-pin active fa fa-map-marker" aria-hidden="true"></i>'
    )     
    const iconLayoutDefault = ymaps.templateLayoutFactory.createClass(
        '<i class="map-pin fa fa-map-marker" aria-hidden="true"></i>'
    ) 

    map.events.add('click', e => {
        lastCoords = e.get('coords');
        position = e.get('position');
        let coordToAdress = ymaps.geocode(lastCoords);
        let id = Date.now();

        coordToAdress.then(res => {
            let obj = res.geoObjects.get(0);

            lastAddress = obj.properties.get('name');   
            showModal(id, position, lastAddress, lastCoords)
            clearEmptyPinInClusterer()

            let placemark = createPlacemark(id, lastCoords, lastAddress);
            
            clusterer.add(placemark);
            map.geoObjects.add(clusterer);  
        })
    })

    map.geoObjects.events.add('click', e => {
        let marker = e.get('target');
        let type = marker.properties.get('type');
        let id = marker.properties.get('test-id');
        let lastAddress = marker.properties.get('address');

        position = e.get('position');

        if (type === 'geoMarker') {
            e.preventDefault();
            marker.options.set('iconContentLayout', iconLayoutActive);
            showModal(id, position, lastAddress)
        }        
    })

    modalSaveReview.addEventListener('click', e => {
        e.preventDefault()
        let btn = e.target;
        let form = btn.parentNode;
        let id = form.dataset.id;
        let coords = form.dataset.coords;
        let name = form.name.value;
        let address = form.address.value;
        let text = form.text.value;
        let dateNow = new Date();
        let dateFull = `${dateNow.getDate()}.${dateNow.getUTCMonth() + 1}.${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`
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
            let pinsArr = clusterer.getGeoObjects();

            for (let i = 0; i < pinsArr.length; i++) {
                const pin = pinsArr[i];

                if (pin.properties.get('test-id') === Number(id)) {
                    pin.properties.set('withReviews', true)

                    pin.properties.set('balloonContentHeader', `${lastAddress}`);
                    pin.properties.set('balloonContentBody', `<a href="#" class="baloon-link" data-id="${id}" data-coords="${lastCoords}" data-title="${lastAddress}">    ${lastAddress}    <a>`);
                    pin.properties.set('balloonContentFooter', `${dateFull}`);

                }

            }

            let comment = comments.find(item => {
                return item.id === id;
            })

            if (!comment) {
                
                comments.push({
                    id,
                    lastAddress,
                    dateFull,
                    coords,
                    list: [{
                        name,
                        address,
                        dateFull,
                        text  
                    }]
                })
            } else {                
                comment.list.push({
                    name,
                    address,
                    dateFull,
                    text  
                })
            }     
                
            localStorage.comments = JSON.stringify(comments);

            let commentList = modal.querySelector('.modal__comments-list');
    
            commentList.innerHTML = generateComments(id);
            
            form.reset()
        }
    })
    function clearEmptyPinInClusterer() {
        let pinsArr = clusterer.getGeoObjects();
        
        for (let i = 0; i < pinsArr.length; i++) {
            const pin = pinsArr[i];

            if (!pin.properties.get('withReviews')) {
                clusterer.remove(pin);
            } else {
                pin.options.set('iconContentLayout', iconLayoutDefault);
            }        

        }
    }

    if (localStorage.getItem('comments') ) {
        let comments = JSON.parse(localStorage.getItem('comments') )

        for (let comment of comments) {
            let [x, y] = comment.coords.split(',');
            let coords = [Number(x), Number(y)];        
            let placemark = createPlacemark(comment.id, coords, comment.lastAddress, true, { dateFull: comment.dateFull }, 'default');

            clusterer.add(placemark);
            
        }
        map.geoObjects.add(clusterer);
    }

    function createPlacemark(id, coords, lastAddress, withReviews = false, content = null, layout = 'active') {
        const placemark = new ymaps.Placemark(coords, {}, {
            iconImageHref: '',
            iconImageSize: [29, 50],
            iconImageOffset: [-14, -25],
            iconLayout: 'default#imageWithContent',
            iconContentLayout: (layout === 'active') ? iconLayoutActive : iconLayoutDefault
        })
               
        placemark.properties.set('test-id', id);
        placemark.properties.set('type', 'geoMarker');
        placemark.properties.set('address', lastAddress);
        placemark.properties.set('withReviews', withReviews);

        if (content) {
            placemark.properties.set('balloonContentHeader', `${lastAddress}`);
            placemark.properties.set('balloonContentBody', `<a href="#" class="baloon-link" data-id="${id}" data-coords="${lastCoords}" data-title="${lastAddress}">    ${lastAddress}    <a>`);
            placemark.properties.set('balloonContentFooter', `${content.dateFull}`);
        }

        return placemark;
    }
    function showModal(id, position, titleName, coords = '') {
        modal.classList.add('active')
        let form = modal.querySelector('#add-review');

        form.dataset.id = id;
        form.dataset.coords = coords;
        let title = modal.querySelector('.modal__title');

        title.innerHTML = titleName;

        let commentList = modal.querySelector('.modal__comments-list');

        commentList.innerHTML = generateComments(String(id));

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
        clearEmptyPinInClusterer();
    }
    modalCloseBtn.addEventListener('click', hideModal)

    function generateComments(id) {
        let comment = comments.find(item => {
            return item.id === id;
        })

        if (!comment) {
            return 'Отзывов ещё нет'
        }

        let modalHtml = renderReview({
            list: comment.list
        })

        return modalHtml;
    }
    function modalFormValidate() {
        const form = document.getElementById('add-review')
        const inputs = form.querySelectorAll('.modal-review__input');

        for (let input of inputs) {
            if (input.required) {
                input.addEventListener('keyup', onInputChange)
            }
        }

        function onInputChange(evt) {
            let input = evt.target;
            let value = input.value;

            if (!value) {
                input.classList.add('required')
            } else {
                input.classList.remove('required')
            }            
        }
    }
    modalFormValidate()
    modalDnD()
}

ymaps.ready(init)

