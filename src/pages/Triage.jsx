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
    <div className="card mx-auto w-full max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Registrar paciente</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Captura datos básicos y obtén una clasificación inicial.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="Nombre"
          onChange={e => setForm({...form, name:e.target.value})} />

        <input className="input" placeholder="Edad"
          onChange={e => setForm({...form, age:e.target.value})} />
      </div>

      <input className="input" placeholder="Síntoma principal"
        onChange={e => setForm({...form, symptom:e.target.value})} />

      <div className="grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="Temperatura"
          onChange={e => setForm({...form, temp:e.target.value})} />

        <input className="input" placeholder="Frecuencia cardíaca"
          onChange={e => setForm({...form, fc:e.target.value})} />
      </div>

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
