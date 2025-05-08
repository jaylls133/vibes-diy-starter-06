
import React, { useState } from "react";
import { useFireproof } from "use-fireproof";
import { callAI } from "call-ai";

interface Note {
  type: string;
  content: string;
  createdAt: string;
}

const ExampleUsage: React.FC = () => {
  const { database, useLiveQuery } = useFireproof("my-app");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { docs } = useLiveQuery("type", { key: "note" });

  const handleAIRequest = async () => {
    setLoading(true);
    try {
      const response = await callAI("Summarize the key benefits of local-first applications");
      // Convert response to string if it's not already
      const responseText = typeof response === "string" ? response : JSON.stringify(response);
      setResult(responseText);
      
      // Save to Fireproof
      await database.put({
        type: "note",
        content: responseText,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error calling AI:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Fireproof + AI Demo</h2>
      
      <button
        onClick={handleAIRequest}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {loading ? "Loading..." : "Generate Content with AI"}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h3 className="font-semibold">AI Response:</h3>
          <p className="mt-1">{result}</p>
        </div>
      )}
      
      {docs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Saved Notes:</h3>
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc._id} className="p-2 bg-gray-50 rounded">
                {(doc as unknown as Note).content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExampleUsage;
