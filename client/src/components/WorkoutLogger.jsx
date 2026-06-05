import { useState } from 'react';

const EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
  'Barbell Row', 'Pull-ups', 'Dips', 'Leg Press',
  'Lat Pulldown', 'Bicep Curl', 'Tricep Extension',
  'Leg Curl', 'Leg Extension', 'Lateral Raise',
  'Plank', 'Crunches', 'Running', 'Other',
];

export default function WorkoutLogger({ exercises = [], onChange, disabled }) {
  const [adding, setAdding] = useState(false);
  const [newExercise, setNewExercise] = useState('');
  const [newSets, setNewSets] = useState('3');
  const [newReps, setNewReps] = useState('10');
  const [newWeight, setNewWeight] = useState('');

  function addExercise() {
    if (!newExercise) return;
    onChange([...exercises, {
      exercise: newExercise,
      sets: Number(newSets) || 0,
      reps: Number(newReps) || 0,
      weight_kg: newWeight ? Number(newWeight) : null,
    }]);
    setNewExercise('');
    setNewSets('3');
    setNewReps('10');
    setNewWeight('');
    setAdding(false);
  }

  function removeExercise(index) {
    onChange(exercises.filter((_, i) => i !== index));
  }

  function updateExercise(index, field, value) {
    onChange(exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
  }

  return (
    <div className="space-y-2">
      {/* Exercise list */}
      {exercises.map((ex, i) => (
        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 group">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{ex.exercise}</div>
            <div className="flex items-center gap-2 mt-1">
              {!disabled ? (
                <>
                  <div className="flex items-center gap-1">
                    <input type="number" value={ex.sets}
                      onChange={e => updateExercise(i, 'sets', Number(e.target.value))}
                      className="w-10 text-xs text-center border border-gray-200 rounded-md py-0.5 focus:outline-none focus:border-indigo-400"
                      min="0" />
                    <span className="text-xs text-gray-400">sets</span>
                  </div>
                  <span className="text-gray-300">×</span>
                  <div className="flex items-center gap-1">
                    <input type="number" value={ex.reps}
                      onChange={e => updateExercise(i, 'reps', Number(e.target.value))}
                      className="w-10 text-xs text-center border border-gray-200 rounded-md py-0.5 focus:outline-none focus:border-indigo-400"
                      min="0" />
                    <span className="text-xs text-gray-400">reps</span>
                  </div>
                  {ex.weight_kg !== null && (
                    <>
                      <span className="text-gray-300">@</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={ex.weight_kg ?? ''}
                          onChange={e => updateExercise(i, 'weight_kg', e.target.value ? Number(e.target.value) : null)}
                          className="w-14 text-xs text-center border border-gray-200 rounded-md py-0.5 focus:outline-none focus:border-indigo-400"
                          step="0.5" />
                        <span className="text-xs text-gray-400">kg</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-500">
                  {ex.sets} × {ex.reps}
                  {ex.weight_kg !== null && ` @ ${ex.weight_kg}kg`}
                </div>
              )}
            </div>
          </div>
          {!disabled && (
            <button onClick={() => removeExercise(i)}
              className="w-6 h-6 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 text-xs font-bold flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0">
              ×
            </button>
          )}
        </div>
      ))}

      {/* Add exercise form */}
      {!disabled && (
        adding ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
            <select value={newExercise} onChange={e => setNewExercise(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-400 bg-white">
              <option value="">Choose exercise...</option>
              {EXERCISES.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            {newExercise && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Sets</label>
                    <input type="number" value={newSets} onChange={e => setNewSets(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-purple-400" min="0" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Reps</label>
                    <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-purple-400" min="0" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Weight (kg)</label>
                    <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                      placeholder="—" step="0.5"
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-purple-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addExercise}
                    className="flex-1 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition-colors">
                    Add Exercise
                  </button>
                  <button onClick={() => { setAdding(false); setNewExercise(''); }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold transition-colors">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-1.5 text-xs font-semibold text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors">
            + Add exercise
          </button>
        )
      )}
    </div>
  );
}
