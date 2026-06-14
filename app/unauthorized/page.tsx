export default function Unauthorized() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-red-500 text-2xl">
        ❌ You are not allowed to access this page
      </h1>
    </div>
  );
}