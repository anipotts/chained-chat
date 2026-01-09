export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Logo/Title */}
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          chained.chat
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-gray-400">
          One prompt. All models. See the difference.
        </p>

        {/* Model badges */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <ModelBadge name="GPT-4o" color="bg-emerald-900/50 border-emerald-700" />
          <ModelBadge name="Claude" color="bg-orange-900/50 border-orange-700" />
          <ModelBadge name="Gemini" color="bg-blue-900/50 border-blue-700" />
          <ModelBadge name="Grok" color="bg-purple-900/50 border-purple-700" />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mt-8 max-w-md mx-auto">
          Compare responses from multiple AI models side-by-side.
          Find the best model for your task. Save time and money.
        </p>

        {/* Coming Soon */}
        <div className="mt-12 space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider">Coming Soon</p>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />
        </div>
      </div>
    </main>
  );
}

function ModelBadge({ name, color }: { name: string; color: string }) {
  return (
    <div className={`px-4 py-2 rounded-lg border text-sm font-medium ${color}`}>
      {name}
    </div>
  );
}
