const Modal = ({ open, children }) => {
    const isOpen = open ?? false;
    
    return (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                { children }
            </div>
        )
)};

export default Modal;
