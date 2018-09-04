import './styles/styles.scss';
import renderReview from './../modal-review.hbs';

let comments = [];
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

    map.events.add('click', e => {
        lastCoords = e.get('coords');
        position = e.get('position');
        let coordToAdress = ymaps.geocode(lastCoords);
        let id = Date.now();

        coordToAdress.then(res => {
            let obj = res.geoObjects.get(0);

            lastAddress = obj.properties.get('name');
      
            showModal(id, position, lastAddress)
            
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
            showModal(id, position, lastAddress)
        }        
    })

    modalSaveReview.addEventListener('click', e => {
        e.preventDefault()
        let btn = e.target;
        let form = btn.parentNode;
        let id = form.dataset.id;
        let name = form.name.value;
        let address = form.address.value;
        let text = form.text.value;
        let dateNow = new Date();
        let date = `${dateNow.getDate()}.${dateNow.getUTCMonth() + 1}.${dateNow.getFullYear()}`;
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
            let content = {
                name,
                address,
                text,
                dateFull
            }
            let placemark = createPlacemark(id, lastCoords, lastAddress, content);

            map.geoObjects.add(placemark);

            clusterer.add(placemark);
            map.geoObjects.add(clusterer);

            let comment = comments.find(item => {
                return item.id === id;
            })
            
            if (!comment) {
                comments.push({
                    id,
                    lastAddress,
                    list: [{
                        name,
                        address,
                        date,
                        text  
                    }]
                })
            } else {
                comment.list.push({
                    name,
                    address,
                    date,
                    text  
                })
            }         
            
            let commentList = modal.querySelector('.modal__comments-list');
    
            commentList.innerHTML = generateComments(id);
            form.reset()
        }
    })
}

ymaps.ready(init)

function createPlacemark(id, coords, lastAddress, content) {
    let MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
        '<i class="map-pin active fa fa-map-marker" aria-hidden="true"></i>'
    )

    const placemark = new ymaps.Placemark(coords, {}, {
        iconImageHref: '',
        iconImageSize: [29, 50],
        iconImageOffset: [-14, -25],
        iconLayout: 'default#imageWithContent',
        iconContentLayout: MyIconContentLayout
    })

    placemark.properties.set('balloonContentHeader', `${content.address}`);
    placemark.properties.set('balloonContentBody', `<a href="#" class="baloon-link" data-id="${id}" data-coords="${coords}" data-title="${lastAddress}">    ${lastAddress}    <a>    <br>    ${content.text}`);
    placemark.properties.set('balloonContentFooter', `${content.dateFull}`);

    placemark.properties.set('test-id', id);
    placemark.properties.set('type', 'geoMarker');
    placemark.properties.set('address', lastAddress);

    return placemark;
}

function showModal(id, position, titleName) {    
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

const modalHeader = document.querySelector('.modal__header');
let shift;
let modalSize = {
    width: null,
    height: null,
    offsetLeft: null,
    offsetTop: null    
}
let windowWidth;
let windowHeight;

modalHeader.addEventListener('dragstart', evt => {
    evt.dataTransfer.effectAllowed = 'move';
    shift = {
        left: `${evt.clientX - evt.target.offsetParent.offsetLeft}`,
        top: `${evt.clientY - evt.target.offsetParent.offsetTop}`
    }
    modalSize.width = evt.target.offsetParent.clientWidth;
    modalSize.height = evt.target.offsetParent.clientHeight;
    
    windowWidth = document.documentElement.clientWidth;
    windowHeight = document.documentElement.clientHeight;
     
})

modalHeader.addEventListener('drag', evt => {
    modal.style.left = `${evt.clientX - shift.left}px`
    modal.style.top = `${evt.clientY - shift.top}px`   
    
    modalSize.offsetLeft = evt.target.offsetParent.offsetLeft;
    modalSize.offsetTop = evt.target.offsetParent.offsetTop;
    
    if (modalSize.offsetLeft + modalSize.width >= windowWidth) {
        modal.style.left = `${windowWidth - modalSize.width}px`;
    } else if (modalSize.offsetLeft <= 0) {
        modal.style.left = '0px';        
    }

    if (modalSize.offsetTop + modalSize.height >= windowHeight) {
        modal.style.top = `${windowHeight - modalSize.height}px`
    } else if (modalSize.offsetTop <= 0) {
        modal.style.top = '0px'
    }
})

modalHeader.addEventListener('dragend', evt => {
    evt.preventDefault(); 
    modal.style.left = `${evt.clientX - shift.left}px`
    modal.style.top = `${evt.clientY - shift.top}px`
    
    modalSize.offsetLeft = evt.target.offsetParent.offsetLeft;
    modalSize.offsetTop = evt.target.offsetParent.offsetTop;

    if (modalSize.offsetLeft + modalSize.width >= windowWidth) {
        modal.style.left = `${windowWidth - modalSize.width}px`;
    } else if (modalSize.offsetLeft <= 0) {
        modal.style.left = '0px';
    }

    if (modalSize.offsetTop + modalSize.height >= windowHeight) {
        modal.style.top = `${windowHeight - modalSize.height}px`
    } else if (modalSize.offsetTop <= 0) {
        modal.style.top = '0px'
    }
})