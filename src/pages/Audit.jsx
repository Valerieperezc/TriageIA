import { usePatients } from "../context/PatientContext";

export default function Audit(){
  const { history } = usePatients();

  return (
    <div>
      {history.map((h,i)=>(
        <div key={i} className="card mb-2">
          {h.name} - {h.action} - {h.date}
        </div>
      ))}
    </div>
  );
}