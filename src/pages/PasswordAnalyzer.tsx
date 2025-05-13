
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { mockCheckPassword } from "@/lib/supabase";

const formSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

const PasswordAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsAnalyzing(true);
    setResults(null);

    try {
      const analysis = await mockCheckPassword(values.password);
      setResults(analysis);
    } catch (error) {
      console.error("Password analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreText = (score: number) => {
    if (score >= 90) return "Very Strong";
    if (score >= 70) return "Strong";
    if (score >= 50) return "Moderate";
    if (score >= 30) return "Weak";
    return "Very Weak";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500 bg-green-500";
    if (score >= 70) return "text-emerald-500 bg-emerald-500";
    if (score >= 50) return "text-amber-500 bg-amber-500";
    if (score >= 30) return "text-orange-500 bg-orange-500";
    return "text-red-500 bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cyber-blue font-mono">Password Analyzer</h1>
        <p className="text-cyber-gray mt-2">
          Check password strength and breach status
        </p>
      </div>

      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="text-xl font-mono">Password Strength Test</CardTitle>
          <CardDescription>
            Enter a password to analyze its security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password to analyze"
                        className="cyber-input"
                        {...field}
                        disabled={isAnalyzing}
                      />
                    </FormControl>
                    <FormDescription>
                      Your password is never stored or sent to third parties
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full cyber-btn" 
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-xl font-mono">Strength Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-cyber-gray">Password Strength</span>
                  <span className={getScoreColor(results.score)}>
                    {getScoreText(results.score)}
                  </span>
                </div>
                <Progress value={results.score} className="h-2" />
              </div>

              {results.suggestions.length > 0 && (
                <div className="bg-cyber-blue/5 border border-cyber-blue/20 rounded-md p-4">
                  <h3 className="font-medium mb-2 text-cyber-lightgray">Suggestions to improve:</h3>
                  <ul className="list-disc pl-5 text-cyber-gray space-y-1">
                    {results.suggestions.map((suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`cyber-card ${results.breached ? 'border-cyber-red/50' : 'border-green-500/30'}`}>
            <CardHeader>
              <CardTitle className="text-xl font-mono">Data Breach Check</CardTitle>
              <CardDescription>
                Checking if this password has appeared in known data breaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {results.breached ? (
                  <>
                    <AlertCircle className="h-10 w-10 text-cyber-red" />
                    <div>
                      <h3 className="font-medium text-cyber-red mb-1">Password Compromised!</h3>
                      <p className="text-cyber-gray">
                        This password has appeared in data breaches and should NOT be used.
                        Choose a different password immediately.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-10 w-10 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-500 mb-1">Password Not Found in Data Breaches</h3>
                      <p className="text-cyber-gray">
                        This password hasn't been found in known data breaches.
                        Remember to use unique passwords for each service.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PasswordAnalyzer;
