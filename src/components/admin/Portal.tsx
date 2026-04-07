import { createPortal } from "react-dom";

const Portal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};

export default Portal;
