export default function TemplatesLoading() {
  return (
    <main className="min-h-screen bg-white p-6 sm:p-10">
      <div className="mx-auto max-w-5xl animate-pulse space-y-5">
        <div className="h-10 w-56 rounded bg-gray-200" />
        <div className="h-28 rounded-lg bg-red-100" />
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-48 rounded-lg bg-gray-100" />)}
      </div>
    </main>
  );
}
