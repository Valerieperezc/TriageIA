import { useParams } from "react-router-dom";
import { usePatients } from "../context/PatientContext";

export default function PatientDetail(){
  const { id } = useParams();
  const { patients, updateStatus } = usePatients();

  const p = patients.find(p=>p.id===id);
  if(!p) return null;

  const minutes = Math.floor((Date.now()-p.createdAt)/60000);

  return (
    <div className="card space-y-4">

      <h1 className="text-xl font-bold">{p.name}</h1>

      <p><b>Edad:</b> {p.age}</p>
      <p><b>Síntoma:</b> {p.symptom}</p>
      <p><b>Triage:</b> {p.triage}</p>
      <p><b>Estado:</b> {p.status}</p>
      <p><b>Tiempo:</b> {minutes} min</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={()=>updateStatus(id,"En atención")}
          className="btn bg-orange-500">
          Atender
        </button>

        <button
          onClick={()=>updateStatus(id,"Finalizado")}
          className="btn bg-green-600">
          Finalizar
        </button>
      </div>

    </div>
  );
}
