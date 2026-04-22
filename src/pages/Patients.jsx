import { usePatients } from "../context/PatientContext";
import { useNavigate } from "react-router-dom";

export default function Patients() {
  const { patients } = usePatients();
  const nav = useNavigate();

  const order = { I:1, II:2, III:3 };

  const sorted = [...patients].sort((a,b)=>
    order[a.triage]-order[b.triage]
  );

  return (
    <div className="space-y-3">

      {sorted.map(p => {

        const minutes = Math.floor((Date.now()-p.createdAt)/60000);

        return (
          <div
            key={p.id}
            onClick={()=>nav(`/patient/${p.id}`)}
            className={`card cursor-pointer ${
              p.triage==="I" ? "border-l-4 border-red-500" : ""
            }`}
          >

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">
                <p className="font-bold">{p.name}</p>
                <p className="truncate text-xs">{p.symptom}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {minutes} min
                </p>
              </div>

              <span className={`font-bold ${
                p.triage==="I"?"text-red-500":
                p.triage==="II"?"text-orange-500":
                "text-green-500"
              }`}>
                {p.triage}
              </span>

            </div>

          </div>
        );
      })}

    </div>
  );
}
