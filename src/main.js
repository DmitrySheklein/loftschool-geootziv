import './styles/styles.scss';
import renderReview from './../modal-review.hbs';

let comments = [
    {
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
    }
]

let modalHtml = renderReview({ comments })
let modal = document.querySelector('.modal__comments-list');

modal.innerHTML = modalHtml;

const init = () => {
    const map = new ymaps.Map('map', {
        center: [55.751291, 37.628372],
        zoom: 12,
        behaviors: ['default', 'scrollZoom']
    }, {
        searchControlProvider: 'yandex#search'
    });
    
    map.events.add('click', e => {
        let coords = e.get('coords');

        let coordToAdress = ymaps.geocode(coords)

        coordToAdress.then(res=> {
            let obj = res.geoObjects.get(0);
            let lastAddress = obj.properties.get('name');
            
            console.log(lastAddress);
            
            const placemark = new ymaps.Placemark(coords)
            console.log(placemark);
            
            map.geoObjects.add(placemark);
        })
    })

    map.geoObjects.events.add('click', e => {
        console.log('marked click');        
    })
}

ymaps.ready(init)