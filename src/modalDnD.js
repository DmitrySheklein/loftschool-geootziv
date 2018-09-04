export function modalDnD() {
    const modal = document.getElementById('modal');
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
        let img = document.createElement('img');

        img.src = '';
        evt.dataTransfer.setDragImage(img, 0, 0);
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

    modalHeader.addEventListener('drag', modalMove)

    modalHeader.addEventListener('dragend', modalMove)

    function modalMove(evt) {        
        if (evt.type === 'dragend') {            
            evt.preventDefault()
        }
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
    }
}