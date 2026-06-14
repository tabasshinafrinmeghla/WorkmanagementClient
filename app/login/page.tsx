"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { loginUser} from "@/src/services/auth.api";
import { registerUser } from "@/src/services/auth.api";
// import { loginUser, registerUser } from "@/src/services/auth.api";



interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isRegister) {
        const res = await registerUser (formData);

        alert("Registration Successful");
        console.log(res);
        setIsRegister(false);
        return;
      }

      const res = await loginUser ({
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", res.token);
      alert("Login Successful");
      console.log(res);

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      // Safely check if error is an object and parse its message
      const err = error as AxiosErrorResponse;
      
      alert(
        err?.response?.data?.message || 
        "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? "Create Account" : "Login"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <Label>Name</Label>
                <Input
                  name="name"
                  placeholder="John Doe"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Role</Label>
                <select
                  name="role"
                  className="w-full border rounded-md p-2"
                  onChange={handleChange}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="admin@gmail.com"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="******"
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isRegister ? "Register" : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            className="text-blue-600 text-sm"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </div>
      </Card>
    </div>
  );
}