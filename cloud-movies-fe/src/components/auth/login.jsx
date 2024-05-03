import "./register.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="register">
      <div className="register-wrapper">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8">Log In</h1>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
          style={{ marginBottom: 32 }}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          id="submit-button"
          variant="secondary"
          className="text-lg py-6 px-10 rounded-medium font-bold text-white bg-gradient-to-br from-zinc-900 dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 dark:bg-zinc-800"
        >
          Log In
        </Button>
        <p>Don't have an account? Register.</p>
      </div>
    </div>
  );
}

export default Login;
