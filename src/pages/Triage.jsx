import { usePatients } from "../context/PatientContext";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Triage() {
  const { addPatient } = usePatients();

  const [form, setForm] = useState({
    name: "",
    age: "",
    symptom: "",
    temp: "",
    fc: ""
  });

  const getTriage = () => {
    const t = Number(form.temp);
    const f = Number(form.fc);

    if (!t || !f) return null;
    if (t > 39 || f > 130) return "I";
    if (t > 38) return "II";
    return "III";
  };

  const triage = getTriage();

  const submit = () => {
    if (!form.name || !form.symptom) {
      return toast.error("Completa los campos");
    }

    addPatient({
      ...form,
      temp: Number(form.temp),
      fc: Number(form.fc)
    });

    toast.success(`Clasificado como TRIAGE ${triage}`);
  };

  return (
    <div className="card max-w-md space-y-3">

      <input className="input" placeholder="Nombre"
        onChange={e => setForm({...form, name:e.target.value})} />

      <input className="input" placeholder="Edad"
        onChange={e => setForm({...form, age:e.target.value})} />

      <input className="input" placeholder="Síntoma principal"
        onChange={e => setForm({...form, symptom:e.target.value})} />

      <input className="input" placeholder="Temperatura"
        onChange={e => setForm({...form, temp:e.target.value})} />

      <input className="input" placeholder="Frecuencia cardíaca"
        onChange={e => setForm({...form, fc:e.target.value})} />

      {triage && (
        <div className={`p-3 rounded-xl ${
          triage==="I" ? "bg-red-100 text-red-600" :
          triage==="II" ? "bg-orange-100 text-orange-600" :
          "bg-green-100 text-green-600"
        }`}>
          TRIAGE {triage}
        </div>
      )}

      <button onClick={submit} className="btn btn-primary w-full">
        Registrar paciente
      </button>

    </div>
  );
}