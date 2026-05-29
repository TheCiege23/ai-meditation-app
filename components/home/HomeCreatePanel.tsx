type SessionMode = "meditation" | "breathing" | "yoga";
type CurrentPlan = "guest" | "free" | "premium";

type Preset = {
  presetId: string;
  name: string;
  mode: string;
  meditationType: string;
  breathingPattern: string | null;
  voiceTone: string;
  visual: string;
  duration: string;
  sounds: string[];
};

type VoiceTone = {
  label: string;
  value: string;
  description: string;
};

type SoundOption = {
  label: string;
  value: string;
  icon: string;
  accent: string;
};

type VisualScene = {
  label: string;
  value: string;
};

type TimerStyleOption = {
  label: string;
  value: string;
};

type BreathingPattern = {
  label: string;
  value: string;
  description: string;
};

type ViewerEntitlements = {
  maxDurationMinutes: number;
  sleepMode: boolean;
  soundMixer: boolean;
  allowedVoiceTones: string[];
  allowedSounds: string[];
};

type HomeCreatePanelProps = {
  darkMode: boolean;
  surfaceClass: string;
  sectionHeadingClass: string;
  secondaryTextClass: string;
  fieldClass: string;
  sessionMode: SessionMode;
  selectedMeditationType: string;
  selectedMood: string;
  selectedDuration: string;
  selectedPattern: string;
  selectedYogaFocus: string;
  selectedYogaLevel: "beginner" | "intermediate" | "advanced";
  selectedVisual: string;
  selectedTimerStyle: string;
  selectedSounds: string[];
  meditationText: string;
  isGeneratingText: boolean;
  isGeneratingSpeech: boolean;
  isGeneratingVideo: boolean;
  videoStatusMessage: string;
  meditationVideoUrl: string | null;
  isPlaying: boolean;
  meditationTypes: Array<{ label: string; value: string }>;
  moods: string[];
  durations: string[];
  yogaFocusOptions: Array<{ label: string; value: string }>;
  yogaLevelOptions: Array<{ label: string; value: "beginner" | "intermediate" | "advanced" }>;
  voiceTones: VoiceTone[];
  breathingPatterns: BreathingPattern[];
  visualScenes: VisualScene[];
  timerStyles: TimerStyleOption[];
  soundOptions: SoundOption[];
  currentPattern: BreathingPattern;
  entitlements: ViewerEntitlements;
  presets: Preset[];
  currentPlan: CurrentPlan;
  onSessionModeChange: (mode: SessionMode) => void;
  onMeditationTypeChange: (value: string) => void;
  onMoodChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onPatternChange: (value: string) => void;
  onYogaFocusChange: (value: string) => void;
  onYogaLevelChange: (value: "beginner" | "intermediate" | "advanced") => void;
  onVisualChange: (value: string) => void;
  onTimerStyleChange: (value: string) => void;
  onSoundChange: (value: string) => void;
  onGenerate: () => void;
  onGenerateVideo: () => void;
  onPlay: () => void;
  onQuickBreathingStart: () => void;
  onStop: () => void;
  onSavePreset: () => void;
  onApplyPreset: (preset: Preset) => void;
  onDeletePreset: (presetId: string) => void;
  onCreateAccount: () => void;
  onUpgrade: () => void;
};

export default function HomeCreatePanel({
  darkMode,
  surfaceClass,
  sectionHeadingClass,
  secondaryTextClass,
  fieldClass,
  sessionMode,
  selectedMeditationType,
  selectedMood,
  selectedDuration,
  selectedPattern,
  selectedYogaFocus,
  selectedYogaLevel,
  selectedVisual,
  selectedTimerStyle,
  selectedSounds,
  meditationText,
  isGeneratingText,
  isGeneratingSpeech,
  isGeneratingVideo,
  videoStatusMessage,
  meditationVideoUrl,
  isPlaying,
  meditationTypes,
  moods,
  durations,
  yogaFocusOptions,
  yogaLevelOptions,
  voiceTones,
  breathingPatterns,
  visualScenes,
  timerStyles,
  soundOptions,
  currentPattern,
  entitlements,
  presets,
  currentPlan,
  onSessionModeChange,
  onMeditationTypeChange,
  onMoodChange,
  onDurationChange,
  onPatternChange,
  onYogaFocusChange,
  onYogaLevelChange,
  onVisualChange,
  onTimerStyleChange,
  onSoundChange,
  onGenerate,
  onGenerateVideo,
  onPlay,
  onQuickBreathingStart,
  onStop,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onCreateAccount,
  onUpgrade,
}: HomeCreatePanelProps) {
  const selectedSound = selectedSounds[0] ?? soundOptions[0]?.value ?? "";
  const primaryVoice = voiceTones[0];
  const showPremiumPrompt = currentPlan !== "premium";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className={`${surfaceClass} p-6`}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>
              Simple Session Builder
            </p>
            <h2 className={`mt-2 ${sectionHeadingClass}`}>Build your calm in a few taps</h2>
            <p className={`mt-2 max-w-2xl text-sm ${secondaryTextClass}`}>
              The landing page now keeps things light: a few guided choices per step, one signature voice,
              and a faster path into your first session.
            </p>
          </div>
          <div className={`rounded-2xl px-4 py-3 text-sm ${darkMode ? "border border-white/10 bg-slate-800/90 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
            <p className="font-semibold">Workflow</p>
            <p className="mt-1">Choose your reset, preview the script, then press play.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Pick a format", text: "Meditation, breathing, or yoga." },
            { step: "2", title: "Set the mood", text: "Choose one focus and one scene." },
            { step: "3", title: "Start the guide", text: "Generate the script and play the voiceover." },
          ].map((item) => (
            <div
              key={item.step}
              className={`rounded-2xl border px-4 py-4 ${darkMode ? "border-white/10 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${secondaryTextClass}`}>Step {item.step}</p>
              <p className={`mt-2 text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{item.title}</p>
              <p className={`mt-1 text-sm ${secondaryTextClass}`}>{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>Session type</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onSessionModeChange("meditation")}
                className={`min-h-11 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  sessionMode === "meditation"
                    ? "border-slate-700 bg-slate-900 text-white"
                    : darkMode
                      ? "border-white/10 bg-slate-800 text-slate-100"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                Meditation
              </button>
              <button
                type="button"
                onClick={() => onSessionModeChange("breathing")}
                className={`min-h-11 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  sessionMode === "breathing"
                    ? "border-slate-700 bg-slate-900 text-white"
                    : darkMode
                      ? "border-white/10 bg-slate-800 text-slate-100"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                Breathing
              </button>
              <button
                type="button"
                onClick={() => onSessionModeChange("yoga")}
                className={`min-h-11 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  sessionMode === "yoga"
                    ? "border-slate-700 bg-slate-900 text-white"
                    : darkMode
                      ? "border-white/10 bg-slate-800 text-slate-100"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                Yoga
              </button>
            </div>
          </div>

          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>
              {sessionMode === "breathing"
                ? "Breathing style"
                : sessionMode === "yoga"
                  ? "Yoga setup"
                  : "Guided focus"}
            </label>
            {sessionMode === "breathing" ? (
              <select
                value={selectedPattern}
                onChange={(event) => onPatternChange(event.target.value)}
                className={`w-full ${fieldClass}`}
              >
                {breathingPatterns.map((pattern) => (
                  <option key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </option>
                ))}
              </select>
            ) : sessionMode === "yoga" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={selectedYogaFocus}
                  onChange={(event) => onYogaFocusChange(event.target.value)}
                  className={`w-full ${fieldClass}`}
                >
                  {yogaFocusOptions.map((focus) => (
                    <option key={focus.value} value={focus.value}>
                      {focus.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYogaLevel}
                  onChange={(event) => onYogaLevelChange(event.target.value as "beginner" | "intermediate" | "advanced")}
                  className={`w-full ${fieldClass}`}
                >
                  {yogaLevelOptions.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <select
                value={selectedMeditationType}
                onChange={(event) => onMeditationTypeChange(event.target.value)}
                className={`w-full ${fieldClass}`}
              >
                {meditationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}
            <p className={`mt-2 text-xs ${secondaryTextClass}`}>
              {sessionMode === "breathing"
                ? currentPattern.description
                : sessionMode === "yoga"
                  ? "Choose a yoga focus and level. The script will guide safe movement and pacing."
                : "Choose the kind of calm you want the guide to create."}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>Mood right now</label>
            <select value={selectedMood} onChange={(event) => onMoodChange(event.target.value)} className={`w-full ${fieldClass}`}>
              {moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>Session length</label>
            <select value={selectedDuration} onChange={(event) => onDurationChange(event.target.value)} className={`w-full ${fieldClass}`}>
              {durations.map((duration) => (
                <option key={duration} value={duration}>
                  {duration}
                </option>
              ))}
            </select>
            <p className={`mt-2 text-xs ${secondaryTextClass}`}>
              {showPremiumPrompt
                ? `Premium opens longer guided sessions beyond ${entitlements.maxDurationMinutes} minutes.`
                : "Premium is active, so longer sessions are waiting for you in the full app."}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>Visual scene</label>
            <select value={selectedVisual} onChange={(event) => onVisualChange(event.target.value)} className={`w-full ${fieldClass}`}>
              {visualScenes.map((scene) => (
                <option key={scene.value} value={scene.value}>
                  {scene.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>Timer style</label>
            <select value={selectedTimerStyle} onChange={(event) => onTimerStyleChange(event.target.value)} className={`w-full ${fieldClass}`}>
              {timerStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`mb-2 block ${sectionHeadingClass}`}>Ambient sound</label>
            <select
              value={selectedSound}
              onChange={(event) => onSoundChange(event.target.value)}
              className={`w-full ${fieldClass}`}
            >
              {soundOptions.map((sound) => (
                <option key={sound.value} value={sound.value}>
                  {sound.label}
                </option>
              ))}
            </select>
            <p className={`mt-2 text-xs ${secondaryTextClass}`}>
              {showPremiumPrompt ? "Premium adds the full sound mixer and layered soundscapes." : "You can mix multiple sounds in your premium flows."}
            </p>
          </div>
        </div>

        <div className={`mb-6 rounded-3xl border p-4 ${darkMode ? "border-white/10 bg-slate-800/80" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-semibold text-white shadow-lg">
              CA
            </div>
            <div>
              <p className={`text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                {primaryVoice?.label ?? "ChimAura Guide"}
              </p>
              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                {primaryVoice?.description ?? "A calm, signature avatar voice for your guided session."}
              </p>
            </div>
          </div>
          <p className={`mt-3 text-xs ${secondaryTextClass}`}>
            The landing page uses one signature voice to keep the first session easy. Premium unlocks the full voice library.
          </p>
        </div>

        <div className={`mb-4 space-y-2 rounded-2xl border px-4 py-3 text-xs ${darkMode ? "border-white/10 bg-slate-800/60 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          <p>ChimAura is for general wellness and relaxation only. It is not medical or mental health advice.</p>
          {sessionMode === "yoga" && (
            <p>Move gently and stop if you feel pain, dizziness, numbness, shortness of breath, or unusual discomfort.</p>
          )}
          {currentPlan === "guest" && (
            <p>Guests get 1 free AI session per day. <button type="button" onClick={onCreateAccount} className="font-semibold underline hover:opacity-80">Create a free account</button> for 3 sessions daily.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {sessionMode === "breathing" ? (
            <>
              <button
                type="button"
                onClick={onQuickBreathingStart}
                disabled={isGeneratingSpeech || isPlaying}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Start Breathing Now
              </button>
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGeneratingText}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isGeneratingText ? "Preparing..." : "Preview Breathing Script"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGeneratingText}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isGeneratingText ? "Generating..." : "Generate My Session"}
              </button>
              <button
                type="button"
                onClick={onPlay}
                disabled={!meditationText || isGeneratingSpeech || isPlaying}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isGeneratingSpeech ? "Preparing Voice..." : "Play Voiceover"}
              </button>
              <button
                type="button"
                onClick={onGenerateVideo}
                disabled={!meditationText || isGeneratingVideo}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isGeneratingVideo ? "Building Video..." : "Generate Short Video"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying && !isGeneratingSpeech}
            className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
              darkMode ? "border border-white/10 bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-900"
            }`}
          >
            Stop
          </button>
          {currentPlan !== "guest" ? (
            <button
              type="button"
              onClick={onSavePreset}
              disabled={!meditationText}
              className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Save Preset
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateAccount}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Create Free Account To Save
            </button>
          )}
        </div>

        <p className={`mt-3 text-sm ${secondaryTextClass}`}>
          {sessionMode === "breathing"
            ? "Breathing mode can start immediately with the timer and voice guide."
            : sessionMode === "yoga"
              ? "Generate first to preview the movement cues, then press play when the pace feels right."
              : "Generate first so you can preview the wording, then press play when it feels right."}
        </p>

        <div className="mt-4 space-y-3">
          <p className={`text-sm ${secondaryTextClass}`}>
            {videoStatusMessage || "Generate a short subtitle video from your meditation script."}
          </p>

          {meditationVideoUrl ? (
            <video
              src={meditationVideoUrl}
              controls
              playsInline
              className="w-full rounded-3xl border border-slate-200 bg-black shadow-lg dark:border-white/10"
            />
          ) : null}
        </div>
      </section>

      <div className="grid gap-6">
        {showPremiumPrompt && (
          <section className={`${surfaceClass} p-5`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>
              Premium Package
            </p>
            <h3 className={`mt-2 ${sectionHeadingClass}`}>Unlock the full ChimAura experience</h3>
            <div className="mt-4 space-y-3 text-sm">
              {[
                "Unlimited meditation, speech, and horoscope use.",
                "Up to 60-minute sessions, sleep mode, layered sound mixer, and premium voices.",
                "Saved history, favorites, daily planning, and HeyGen subtitle meditation videos.",
              ].map((item) => (
                <p key={item} className={secondaryTextClass}>
                  {item}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={currentPlan === "guest" ? onCreateAccount : onUpgrade}
              className="mt-4 rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {currentPlan === "guest" ? "Create Account To Unlock Premium" : "Upgrade To Premium"}
            </button>
          </section>
        )}

        <section className={`${surfaceClass} p-5`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>
                Script Preview
              </p>
              <h3 className={`mt-2 ${sectionHeadingClass}`}>Your guided words appear here</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
              {isGeneratingText ? "Building" : meditationText ? "Ready" : "Waiting"}
            </span>
          </div>
          <div
            className={`rounded-3xl border p-4 text-sm leading-7 ${darkMode ? "border-white/10 bg-slate-950/70 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-700"}`}
            data-no-translate="true"
          >
            {meditationText || "Generate a session to preview the full script before you press play."}
          </div>
        </section>

        <section className={`${surfaceClass} p-5`}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>
                Saved Presets
              </p>
              <h3 className={`mt-2 ${sectionHeadingClass}`}>
                {currentPlan === "guest" ? "Create an account to keep your setup" : "Return to your favorite setup"}
              </h3>
            </div>
            {currentPlan === "guest" ? null : (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
                {presets.length} saved
              </span>
            )}
          </div>

          {currentPlan === "guest" ? (
            <div className={`rounded-2xl border p-4 ${darkMode ? "border-cyan-400/20 bg-cyan-500/10" : "border-cyan-200 bg-cyan-50"}`}>
              <p className={`text-sm font-semibold ${darkMode ? "text-cyan-100" : "text-cyan-900"}`}>
                Save your presets, streak, and upgrades with a free account.
              </p>
              <p className={`mt-2 text-sm ${darkMode ? "text-cyan-50/90" : "text-cyan-800"}`}>
                Your first account keeps your calm setup attached to your email so premium purchases and future sessions are easy to restore.
              </p>
              <button
                type="button"
                onClick={onCreateAccount}
                className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Create Free Account
              </button>
            </div>
          ) : presets.length === 0 ? (
            <div className={`rounded-2xl border p-4 text-sm ${darkMode ? "border-white/10 bg-slate-800/80 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              Generate a session and save it here when you want a one-click reset later.
            </div>
          ) : (
            <div className="space-y-3">
              {presets.slice(0, 3).map((preset) => (
                <div key={preset.presetId} className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-slate-800/80" : "border-slate-200 bg-white"}`}>
                  <p className={`text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{preset.name}</p>
                  <p className={`mt-1 text-xs ${secondaryTextClass}`}>
                    {preset.mode === "breathing" ? "Breathing" : preset.mode === "yoga" ? "Yoga" : "Meditation"} | {preset.duration}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onApplyPreset(preset)}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(preset.presetId)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-700 text-slate-100" : "bg-slate-200 text-slate-900"}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
