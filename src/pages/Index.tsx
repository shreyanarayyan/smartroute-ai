import { useMemo, useState } from "react";

const firstStops = ["88 Harbor Way, Brooklyn", "12 Market Street, Queens", "440 Hudson Ave, Manhattan"];

const chartData = [42, 58, 51, 76, 69, 48];

function Index() {
  const [pickup, setPickup] = useState("125 Distribution Drive, Newark");
  const [stops, setStops] = useState(firstStops);
  const [priority, setPriority] = useState("balanced");
  const [vehicle, setVehicle] = useState("van");
  const [optimized, setOptimized] = useState(false);

  const result = useMemo(() => {
    const filledStops = stops.filter((stop) => stop.trim() !== "");
    const priorityRate = priority === "urgent" ? 1.1 : priority === "eco" ? 0.9 : 1;
    const vehicleRate = vehicle === "bike" ? 0.75 : vehicle === "truck" ? 1.2 : 1;
    const distance = Math.max(8, filledStops.length * 7.5 * priorityRate * vehicleRate);
    const time = Math.round(distance * (vehicle === "bike" ? 5 : vehicle === "truck" ? 3.7 : 3.2));
    const bestOrder = optimized ? [...filledStops].sort((a, b) => a.length - b.length) : filledStops;

    return {
      bestOrder,
      distance: distance.toFixed(1),
      time,
      fuelSaved: Math.round(filledStops.length * 2 + (optimized ? 8 : 3)),
      efficiency: Math.min(98, 72 + filledStops.length * 4 + (optimized ? 12 : 0)),
    };
  }, [stops, priority, vehicle, optimized]);

  function addStop() {
    setStops([...stops, ""]);
  }

  function updateStop(index: number, newValue: string) {
    const updatedStops = [...stops];
    updatedStops[index] = newValue;
    setStops(updatedStops);
    setOptimized(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 bg-gradient-command p-6 text-primary-foreground lg:block">
          <div className="mb-10">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary-foreground/15 text-2xl">🚚</div>
            <h2 className="font-display text-2xl font-bold">SmartRoute AI</h2>
            <p className="text-sm text-primary-foreground/70">Logistics dashboard</p>
          </div>

          <nav className="space-y-2">
            {['Dashboard', 'Routes', 'Fleet', 'Analytics'].map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-xl px-4 py-3 text-left font-semibold transition hover:bg-primary-foreground/15 ${
                  index === 0 ? 'bg-primary-foreground/15' : 'text-primary-foreground/75'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-10 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
            <p className="font-semibold">✨ AI dispatcher online</p>
            <p className="mt-2 text-sm text-primary-foreground/70">Route scoring and delivery sequencing are ready.</p>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b bg-card px-5 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-display text-4xl font-bold md:text-5xl">SmartRoute AI</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">Optimize delivery routes between multiple locations using a simple AI-powered logistics workflow.</p>
              </div>
              <button onClick={() => setOptimized(true)} className="rounded-xl bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-command transition hover:-translate-y-0.5">
                Optimize Now
              </button>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-card p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="mt-2 font-display text-3xl font-bold">{result.bestOrder.length}</p>
                <p className="mt-3 text-sm font-semibold text-success">Active stops</p>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">Estimated Distance</p>
                <p className="mt-2 font-display text-3xl font-bold">{result.distance} mi</p>
                <p className="mt-3 text-sm font-semibold text-success">AI calculated</p>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="mt-2 font-display text-3xl font-bold">{result.time} min</p>
                <p className="mt-3 text-sm font-semibold text-success">Current ETA</p>
              </div>
              <div className="rounded-2xl bg-card p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">Fuel Saved</p>
                <p className="mt-2 font-display text-3xl font-bold">{result.fuelSaved}%</p>
                <p className="mt-3 text-sm font-semibold text-success">Projected saving</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl bg-card p-6 shadow-soft">
                <h2 className="mb-5 font-display text-2xl font-bold">Delivery Route Input</h2>

                <label className="block text-sm font-semibold">Pickup location</label>
                <input value={pickup} onChange={(event) => setPickup(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-semibold">Delivery stops</p>
                  {stops.map((stop, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">{index + 1}</span>
                      <input value={stop} onChange={(event) => updateStop(index, event.target.value)} placeholder="Enter delivery address" className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  ))}
                </div>

                <button onClick={addStop} className="mt-4 rounded-xl border bg-card px-4 py-3 font-semibold shadow-soft transition hover:bg-secondary">
                  + Add delivery stop
                </button>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold">Delivery priority</label>
                    <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring">
                      <option value="balanced">Balanced</option>
                      <option value="urgent">Urgent first</option>
                      <option value="eco">Fuel efficient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold">Vehicle type</label>
                    <select value={vehicle} onChange={(event) => setVehicle(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring">
                      <option value="van">Delivery van</option>
                      <option value="truck">Box truck</option>
                      <option value="bike">Cargo bike</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => setOptimized(true)} className="mt-6 w-full rounded-xl bg-gradient-primary px-5 py-4 font-bold text-primary-foreground shadow-command transition hover:-translate-y-0.5">
                  ✨ Optimize Route
                </button>
              </div>

              <div className="rounded-2xl bg-card p-6 shadow-soft">
                <h2 className="mb-5 font-display text-2xl font-bold">Route Visualization</h2>
                <div className="relative min-h-[390px] overflow-hidden rounded-2xl bg-gradient-map p-5">
                  <div className="absolute left-[12%] right-[12%] top-1/2 h-2 -translate-y-1/2 rotate-[-16deg] rounded-full bg-primary/30"></div>
                  <div className="absolute left-[18%] top-[22%] h-28 w-2 rotate-[38deg] rounded-full bg-accent/50"></div>

                  {result.bestOrder.map((stop, index) => (
                    <div key={index} className="absolute grid h-11 w-11 place-items-center rounded-full bg-primary font-bold text-primary-foreground shadow-command animate-route-pulse" style={{ left: `${18 + index * 20}%`, top: `${24 + (index % 2) * 34}%` }}>
                      {index + 1}
                    </div>
                  ))}

                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border bg-card/90 p-4 shadow-soft backdrop-blur">
                    <p className="font-bold">Interactive route panel</p>
                    <p className="mt-1 text-sm text-muted-foreground">Pickup from {pickup || "origin"}, then complete {result.bestOrder.length} optimized stops.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl bg-card p-6 shadow-soft">
                <h2 className="mb-5 font-display text-2xl font-bold">Optimization Results</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary p-4"><p className="text-sm text-muted-foreground">Distance</p><p className="text-2xl font-bold">{result.distance} mi</p></div>
                  <div className="rounded-xl bg-secondary p-4"><p className="text-sm text-muted-foreground">Travel time</p><p className="text-2xl font-bold">{result.time} min</p></div>
                  <div className="rounded-xl bg-secondary p-4"><p className="text-sm text-muted-foreground">Stops</p><p className="text-2xl font-bold">{result.bestOrder.length}</p></div>
                  <div className="rounded-xl bg-secondary p-4"><p className="text-sm text-muted-foreground">Efficiency</p><p className="text-2xl font-bold">{result.efficiency}%</p></div>
                </div>

                <div className="mt-5 space-y-3">
                  {result.bestOrder.map((stop, index) => (
                    <div key={index} className="flex gap-3 rounded-xl border bg-card p-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent font-bold text-accent-foreground">{index + 1}</span>
                      <div>
                        <p className="font-bold">{stop}</p>
                        <p className="text-sm text-muted-foreground">ETA window optimized for route density</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-card p-6 shadow-soft">
                  <h2 className="mb-4 font-display text-2xl font-bold">AI Insights</h2>
                  <p className="rounded-xl bg-secondary p-4">AI grouped nearby stops, reduced backtracking, and balanced travel time with fuel efficiency.</p>
                  <ul className="mt-4 space-y-3 text-muted-foreground">
                    <li>✅ Start with dense delivery zones before traffic peaks.</li>
                    <li>✅ Use fuel efficient priority for lower idle time.</li>
                    <li>✅ Re-optimize when urgent deliveries arrive.</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-card p-6 shadow-soft">
                  <h2 className="mb-5 font-display text-2xl font-bold">Analytics</h2>
                  <div className="flex h-44 items-end gap-3">
                    {chartData.map((value, index) => (
                      <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-xl bg-primary" style={{ height: `${value * 1.8}px` }}></div>
                        <span className="text-xs text-muted-foreground">{['M', 'T', 'W', 'T', 'F', 'S'][index]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl bg-gradient-command p-4 text-primary-foreground">
                    <p className="text-sm text-primary-foreground/70">Fuel consumption estimate</p>
                    <p className="font-display text-3xl font-bold">{Math.max(1.4, Number(result.distance) / 12).toFixed(1)} gal</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Index;