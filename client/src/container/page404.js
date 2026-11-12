import { Link } from "react-router-dom";

function Page404() {
  return (
    <main className="relative flex min-h-[calc(100vh-72px)] w-full flex-col items-center justify-center overflow-hidden bg-ink px-4 text-center">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <span className="label relative">Page not found</span>
      <h1 className="relative mt-4 font-display text-8xl font-medium text-white sm:text-9xl">
        4<span className="text-lime">0</span>4
      </h1>
      <p className="relative mt-4 text-neutral-400">This page isn't on the ledger.</p>
      <Link to="/" className="btn-lime relative mt-8">Go Home</Link>
    </main>
  );
}

export default Page404;
