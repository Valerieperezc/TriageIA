import { usePatients } from "../context/PatientContext";

export default function Audit(){
  const { history } = usePatients();

  return (
    <div className="space-y-3">
      {history.map((h,i)=>(
        <div key={i} className="card">
          {h.name} - {h.action} - {h.date}
        </div>
      ))}
    </div>
  );
}
