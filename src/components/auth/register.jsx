import "./register.css";
import "react-day-picker/dist/style.css";
import { useState } from "react";
import UserPool from "@/aws/UserPool";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

function Register() {
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [preferredUsername, setPreferredUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const register = () => {
    const dataGivenName = {
      Name: "given_name",
      Value: givenName,
    };

    const dataFamilyName = {
      Name: "family_name",
      Value: familyName,
    };

    const dataBirthdate = {
      Name: "birthdate",
      Value: new Date(birthdate).toISOString().split("T")[0],
    };

    const dataEmail = {
      Name: "email",
      Value: email,
    };

    UserPool.signUp(
      preferredUsername,
      password,
      [
        new CognitoUserAttribute(dataGivenName),
        new CognitoUserAttribute(dataFamilyName),
        new CognitoUserAttribute(dataBirthdate),
        new CognitoUserAttribute(dataEmail),
      ],
      null,
      (err, result) => {
        if (err) {
          toast({
            title: "Error",
            description: err.message || JSON.stringify(err),
          });
          return;
        }

        const cognitoUser = result.user;
        console.log(cognitoUser.getUsername());
        toast({
          title: "Successful registration",
          description: "Please check your email and confirm it.",
        });
        navigate("/login");
      }
    );
  };

  return (
    <div className="register">
      <div className="register-wrapper">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8">Welcome to BriefCinema!</h1>
        <div className="row">
          <div className="col">
            <Label
              className="text-sm font-medium text-black dark:text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="givenName"
            >
              First Name
            </Label>
            <Input
              id="givenName"
              className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-white dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
              value={givenName}
              onChange={(event) => setGivenName(event.target.value)}
            />
          </div>
          <div className="col">
            <Label htmlFor="familyName">Last Name</Label>
            <Input
              id="familyName"
              className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-white dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
            />
          </div>
        </div>
        <Label htmlFor="birthdate">Birthdate</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="birthdate"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left text-white font-normal flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400",
                !birthdate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {birthdate ? format(birthdate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 popover-content-custom" align="start">
            <Calendar mode="single" selected={birthdate} onSelect={setBirthdate} captionLayout="dropdown-buttons" fromYear={1930} toYear={2015} className="calendar-custom" />
          </PopoverContent>
        </Popover>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-white dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Label htmlFor="preferredUsername">Username</Label>
        <Input
          id="preferredUsername"
          className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-white dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
          value={preferredUsername}
          onChange={(event) => setPreferredUsername(event.target.value)}
        />
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-white dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
          style={{ marginBottom: 32 }}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          id="submit-button"
          variant="secondary"
          className="text-lg py-6 px-10 rounded-medium font-bold text-white bg-gradient-to-br from-zinc-900 dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 dark:bg-zinc-800"
          onClick={() => register()}
        >
          Register
        </Button>
        <p>
          Already have an account? <Link to="/login">Log In.</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
