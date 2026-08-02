# sensor-feedback

status: open
created: 2026-08-02
epic: sound-of-loam
memory_goal: dab57e87-a213-48ec-b98f-66207a0ac047

## Goal
Every sensor the app reads visibly affects the generative visualization, and a hidable debug bar shows each sensor's live state.

## Notes
Introduces a shared sensor-input layer (currently only pointer is read) feeding the Visualizer
(and available to the engine as bias). Overlaps S-02's cheap-sensor set; sun/weather (S-07) and
cat (S-08) stay out. Privacy: sensor data stays on-device [node:3037236e]; influence is bias
[node:58044d71]. Scope (pinned): pointer, device motion/orientation, mic level, ambient light, time, battery,
+ weather & sun (opt-in, Open-Meteo, geolocation). Sensors feed BOTH the visualizer and the
engine (bias). Cat deferred (S-08 blocked). Weather/sun opt-in behind consent (off-device).
