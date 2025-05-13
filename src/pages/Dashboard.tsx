
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Shield, KeyRound, Mail, Network } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const toolCards = [
    {
      title: "Vulnerability Scanner",
      description: "Scan systems for security vulnerabilities",
      icon: Shield,
      path: "/vulnerability-scanner",
      color: "bg-blue-600/10 text-blue-500",
    },
    {
      title: "Password Analyzer",
      description: "Check password strength and breach status",
      icon: KeyRound,
      path: "/password-analyzer",
      color: "bg-green-600/10 text-green-500",
    },
    {
      title: "Phishing Simulator",
      description: "Create and track phishing awareness campaigns",
      icon: Mail,
      path: "/phishing-simulator",
      color: "bg-amber-600/10 text-amber-500",
    },
    {
      title: "Port Scanner",
      description: "Discover open ports on target systems",
      icon: Network,
      path: "/port-scanner",
      color: "bg-purple-600/10 text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cyber-blue font-mono">Security Dashboard</h1>
        <p className="text-cyber-gray mt-2">
          Welcome back, {user?.email}. Access our cybersecurity toolkit below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {toolCards.map((tool) => (
          <Link to={tool.path} key={tool.title}>
            <Card className="cyber-card h-full transition-all hover:border-cyber-blue/50 hover:shadow-cyber-blue/20">
              <CardHeader>
                <div className={`p-2 w-fit rounded-md ${tool.color}`}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4 text-xl font-mono">{tool.title}</CardTitle>
                <CardDescription className="text-cyber-gray">{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card className="cyber-card bg-cyber-blue/5 border-cyber-blue/40">
          <CardHeader>
            <CardTitle className="text-xl font-mono text-cyber-blue">Quick Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5 text-cyber-lightgray">
              <li>Always use unique, complex passwords for each account</li>
              <li>Enable two-factor authentication whenever possible</li>
              <li>Keep your systems and software updated</li>
              <li>Beware of phishing attempts in emails and messages</li>
              <li>Regularly scan your systems for vulnerabilities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
