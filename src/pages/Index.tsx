import React, { useState, useRef } from "react";
import { useFireproof } from "use-fireproof";
import { callAI } from "call-ai";

const JobPosterApp = () => {
  const { database, useLiveQuery, useDocument } = useFireproof("local-gig-connect");
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("post");
  const [showJobDetails, setShowJobDetails] = useState(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Job form document
  const { doc: jobForm, merge: mergeJobForm, submit: submitJob, reset: resetForm } = useDocument({
    title: "",
    category: "",
    description: "",
    location: "",
    budget: "",
    budgetType: "fixed",
    date: "",
    time: "",
    _files: {},
    status: "Open",
    createdAt: Date.now()
  });

  // Get all jobs, sorted by creation date (newest first)
  const { docs: jobs } = useLiveQuery("createdAt", { descending: true });

  const categories = [
    "Plumbing", 
    "Tutoring", 
    "Repairs", 
    "Cleaning", 
    "Moving", 
    "Gardening",
    "Electrical",
    "Painting",
    "Carpentry",
    "Other"
  ];

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      mergeJobForm({ _files: { jobImage: e.target.files[0] } });
    }
  };

  const handleJobSubmit = (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.category || !jobForm.description || !jobForm.location) {
      alert("Please fill all required fields");
      return;
    }
    
    submitJob();
    setActiveTab("dashboard");
  };

  const generateJobDescription = async () => {
    if (!jobForm.title || !jobForm.category) {
      alert("Please enter a job title and category first");
      return;
    }

    setIsGeneratingDescription(true);
    
    try {
      const prompt = `Create a detailed job description for a ${jobForm.category} job titled "${jobForm.title}". 
      Include typical requirements, scope of work, and appropriate details a client might want to specify.
      Keep it under 200 words and make it professional but approachable.`;

      const response = await callAI(prompt);
      mergeJobForm({ description: response });
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate job description. Please try again or write your own.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const generateDemoData = async () => {
    setIsLoading(true);
    
    try {
      const prompt = `Generate 5 local job listings in JSON format. Each job should have:
      - title: creative but realistic local job title
      - category: one of these categories [${categories.join(', ')}]
      - description: detailed 2-3 sentence job description
      - location: a realistic city and neighborhood
      - budget: a reasonable dollar amount as a number
      - budgetType: either "fixed" or "hourly"
      - date: a future date in YYYY-MM-DD format
      - time: a time range like "2:00 PM - 5:00 PM"
      - status: "Open"`;

      const demoData = await callAI(prompt, {
        schema: {
          properties: {
            jobs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  budget: { type: "string" },
                  budgetType: { type: "string" },
                  date: { type: "string" },
                  time: { type: "string" },
                  status: { type: "string" }
                }
              }
            }
          }
        }
      });

      const parsedData = JSON.parse(demoData);
      
      for (const job of parsedData.jobs) {
        await database.put({
          ...job,
          createdAt: Date.now() - Math.floor(Math.random() * 86400000) // Random time within last 24h
        });
      }
      
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error generating demo data:", error);
      alert("Failed to generate demo data");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    if (confirm("Are you sure you want to delete this job?")) {
      await database.del(jobId);
    }
  };

  const updateJobStatus = async (job, newStatus) => {
    await database.put({
      ...job,
      status: newStatus
    });
  };

  // Background pattern style for Memphis style design
  const backgroundPattern = {
    backgroundImage: `radial-gradient(#ff9770 2px, transparent 2px), radial-gradient(#70d6ff 2px, transparent 2px)`,
    backgroundSize: `30px 30px`,
    backgroundPosition: `0 0, 15px 15px`,
    backgroundColor: '#ffffff'
  };

  return (
    <div className="min-h-screen" style={backgroundPattern}>
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-center mb-2" style={{color: "#242424"}}>
            Local Gig Connect
          </h1>
          <p className="text-xl text-center italic mb-6" style={{color: "#242424"}}>
            *Connect with local talent for your quick jobs and projects. Post a job, find the right person, and get things done!*
          </p>
          
          {/* Navigation tabs */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-4 border-4 border-[#ff70a6] rounded-full p-1 bg-white">
              <button 
                onClick={() => setActiveTab("post")} 
                className={`px-5 py-2 rounded-full font-bold transition-all ${activeTab === "post" ? "bg-[#70d6ff] text-white" : "text-[#242424]"}`}
              >
                Post a Job
              </button>
              <button 
                onClick={() => setActiveTab("dashboard")} 
                className={`px-5 py-2 rounded-full font-bold transition-all ${activeTab === "dashboard" ? "bg-[#70d6ff] text-white" : "text-[#242424]"}`}
              >
                Dashboard
              </button>
            </div>
          </div>
        </header>

        {activeTab === "post" && (
          <div className="bg-white p-6 rounded-lg shadow-lg border-4 border-[#ff9770]">
            <h2 className="text-2xl font-bold mb-4" style={{color: "#242424"}}>Post a New Job</h2>
            
            <form onSubmit={handleJobSubmit}>
              <div className="mb-4">
                <label className="block font-bold mb-2" style={{color: "#242424"}}>Job Title*</label>
                <input
                  type="text"
                  value={jobForm.title}
                  onChange={(e) => mergeJobForm({ title: e.target.value })}
                  className="w-full p-2 border-4 border-[#ffd670] rounded-lg focus:outline-none focus:border-[#ff70a6]"
                  placeholder="e.g., Fix Leaking Kitchen Sink"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-bold mb-2" style={{color: "#242424"}}>Category*</label>
                <select
                  value={jobForm.category}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    mergeJobForm({ category: e.target.value });
                  }}
                  className="w-full p-2 border-4 border-[#ffd670] rounded-lg focus:outline-none focus:border-[#ff70a6]"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4 relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-bold" style={{color: "#242424"}}>Job Description*</label>
                  <button 
                    type="button" 
                    onClick={generateJobDescription}
                    disabled={isGeneratingDescription}
                    className="text-sm px-3 py-1.5 bg-[#70d6ff] text-white font-medium rounded hover:bg-[#ff70a6] transition-colors"
                  >
                    {isGeneratingDescription ? "Generating..." : "Generate Description"}
                  </button>
                </div>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => mergeJobForm({ description: e.target.value })}
                  className="w-full p-2 border-4 border-[#ffd670] rounded-lg min-h-[120px] focus:outline-none focus:border-[#ff70a6]"
                  placeholder="Describe the job in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block font-bold mb-2" style={{color: "#242424"}}>Location*</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => mergeJobForm({ location: e.target.value })}
                    className="w-full p-2 border-4 border-[#ffd670] rounded-lg focus:outline-none focus:border-[#ff70a6]"
                    placeholder="e.g., Downtown, Seattle"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-bold mb-2" style={{color: "#242424"}}>Budget</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={jobForm.budget}
                      onChange={(e) => mergeJobForm({ budget: e.target.value })}
                      className="w-3/5 p-2 border-4 border-r-0 border-[#ffd670] rounded-l-lg focus:outline-none focus:border-[#ff70a6]"
                      placeholder="e.g., 50"
                    />
                    <select
                      value={jobForm.budgetType}
                      onChange={(e) => mergeJobForm({ budgetType: e.target.value })}
                      className="w-2/5 p-2 border-4 border-l-0 border-[#ffd670] rounded-r-lg focus:outline-none focus:border-[#ff70a6]"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block font-bold mb-2" style={{color: "#242424"}}>Preferred Date</label>
                  <input
                    type="date"
                    value={jobForm.date}
                    onChange={(e) => mergeJobForm({ date: e.target.value })}
                    className="w-full p-2 border-4 border-[#ffd670] rounded-lg focus:outline-none focus:border-[#ff70a6]"
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-bold mb-2" style={{color: "#242424"}}>Preferred Time</label>
                  <input
                    type="text"
                    value={jobForm.time}
                    onChange={(e) => mergeJobForm({ time: e.target.value })}
                    className="w-full p-2 border-4 border-[#ffd670] rounded-lg focus:outline-none focus:border-[#ff70a6]"
                    placeholder="e.g., 2:00 PM - 5:00 PM"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block font-bold mb-2" style={{color: "#242424"}}>Upload Image (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="w-full p-3 border-2 border-dashed border-[#70d6ff] rounded-lg text-center hover:bg-[#e9ff70] transition-colors"
                >
                  {jobForm._files.jobImage ? "Image Selected" : "Click to Upload"}
                </button>
                {jobForm._files.jobImage && (
                  <p className="mt-2 text-sm text-gray-600">{jobForm._files.jobImage.name}</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#ff70a6] text-white font-bold rounded-lg hover:bg-[#ff9770] transition-colors"
                >
                  Post Job
                </button>
                <button
                  type="button"
                  onClick={generateDemoData}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {isLoading ? "Generating..." : "Demo Data"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="bg-white p-6 rounded-lg shadow-lg border-4 border-[#ffd670]">
            <h2 className="text-2xl font-bold mb-4" style={{color: "#242424"}}>Your Jobs</h2>
            
            {showJobDetails ? (
              <div className="mb-6">
                <button 
                  onClick={() => setShowJobDetails(null)}
                  className="mb-4 flex items-center text-[#ff70a6] font-medium"
                >
                  <span>← Back to all jobs</span>
                </button>
                
                <div className="border-4 border-[#70d6ff] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold" style={{color: "#242424"}}>{showJobDetails.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${
                      showJobDetails.status === "Open" ? "bg-green-500" :
                      showJobDetails.status === "In Progress" ? "bg-blue-500" :
                      showJobDetails.status === "Completed" ? "bg-purple-500" : 
                      "bg-gray-500"
                    }`}>{showJobDetails.status}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-700 mb-2"><span className="font-bold">Category:</span> {showJobDetails.category}</p>
                      <p className="text-gray-700 mb-2"><span className="font-bold">Location:</span> {showJobDetails.location}</p>
                      <p className="text-gray-700 mb-2">
                        <span className="font-bold">Budget:</span> ${showJobDetails.budget} ({showJobDetails.budgetType})
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700 mb-2"><span className="font-bold">Date:</span> {showJobDetails.date || "Flexible"}</p>
                      <p className="text-gray-700 mb-2"><span className="font-bold">Time:</span> {showJobDetails.time || "Flexible"}</p>
                      <p className="text-gray-700 mb-2">
                        <span className="font-bold">Posted:</span> {new Date(showJobDetails.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-bold mb-2" style={{color: "#242424"}}>Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{showJobDetails.description}</p>
                  </div>
                  
                  {showJobDetails._files?.jobImage && (
                    <div className="mb-6">
                      <h4 className="font-bold mb-2" style={{color: "#242424"}}>Attached Image</h4>
                      <div className="border-2 border-[#ffd670] rounded-lg overflow-hidden">
                        <img 
                          src={URL.createObjectURL(showJobDetails._files.jobImage)} 
                          alt="Job image" 
                          className="w-full max-h-80 object-contain" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-bold mb-2" style={{color: "#242424"}}>Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateJobStatus(showJobDetails, "Open")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showJobDetails.status === "Open" ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 hover:bg-green-100'}`}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => updateJobStatus(showJobDetails, "In Progress")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showJobDetails.status === "In Progress" ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : 'bg-gray-100 hover:bg-blue-100'}`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateJobStatus(showJobDetails, "Completed")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showJobDetails.status === "Completed" ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : 'bg-gray-100 hover:bg-purple-100'}`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => updateJobStatus(showJobDetails, "Cancelled")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showJobDetails.status === "Cancelled" ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-gray-100 hover:bg-red-100'}`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No jobs posted yet</p>
                    <button
                      onClick={() => setActiveTab("post")}
                      className="px-6 py-2 bg-[#ff70a6] text-white font-bold rounded-lg hover:bg-[#ff9770] transition-colors"
                    >
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div 
                        key={job._id} 
                        className="border-4 border-[#70d6ff] rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg" style={{color: "#242424"}}>{job.title}</h3>
                            <p className="text-gray-700 line-clamp-2">{job.description}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              <p className="text-sm text-gray-600"><span className="font-medium">Category:</span> {job.category}</p>
                              <p className="text-sm text-gray-600"><span className="font-medium">Location:</span> {job.location}</p>
                              {job.budget && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Budget:</span> ${job.budget} ({job.budgetType})
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4 flex flex-col items-end">
                            <span className={`px-3 py-1 rounded-full text-white text-sm mb-2 ${
                              job.status === "Open" ? "bg-green-500" :
                              job.status === "In Progress" ? "bg-blue-500" :
                              job.status === "Completed" ? "bg-purple-500" : 
                              "bg-gray-500"
                            }`}>{job.status}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowJobDetails(job)}
                                className="text-sm px-3 py-1 bg-[#70d6ff] text-white rounded hover:bg-[#ff70a6] transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => deleteJob(job._id)}
                                className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPosterApp;