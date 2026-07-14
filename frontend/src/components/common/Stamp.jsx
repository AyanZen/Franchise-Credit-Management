import { STATUS_LABEL } from "../../constants/orderStatus";

export default function Stamp({ status }) {
  return <span className={`stamp stamp-${status}`}>{STATUS_LABEL[status]}</span>;
}
