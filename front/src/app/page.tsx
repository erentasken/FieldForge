'use client'
import React, { useState } from 'react';
import { Upload, X, CheckCircle2, Loader2, ArrowRight, Check, XCircle, FileSpreadsheet, Sparkles, Download, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CSVColumnMapper() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [suggestions, setSuggestions] = useState(null);
  const [mappingDecisions, setMappingDecisions] = useState({});
  const [transformedCSV, setTransformedCSV] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const toggleColumn = (column) => {
    setSelectedColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const getColumnSample = (columnName) => {
    if (!csvData) return [];
    return csvData.slice(1, 7).map(row => row[columnName]);
  };

  const hasValidData = (columnName) => {
    const sample = getColumnSample(columnName);
    console.log("Sample : ", sample)
    return sample.some(v => v !== null && v !== undefined && v !== '');
  };

  const handleSubmitColumns = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {};
    selectedColumns.forEach(column => {
      payload[column] = getColumnSample(column);
    });
    // console.log(JSON.stringify({ data: payload }))
    try {
      const response = await fetch('http://127.0.0.1:8000/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const result = await response.json();

      console.log(result)
      setSuggestions(result);

      const initialDecisions = {};
      Object.keys(result).forEach(col => {
        initialDecisions[col] = {
          accepted: true,
          selectedMapping: result[col].primary
        };
      });
      setMappingDecisions(initialDecisions);
      setStep(3);
      setLoading(false);
    } catch (err) {
      setError(`Failed to submit data: ${err.message}`);
      setLoading(false);
    }
  };

  const toggleAcceptance = (column) => {
    setMappingDecisions(prev => ({
      ...prev,
      [column]: { ...prev[column], accepted: !prev[column].accepted }
    }));
  };

  const selectAlternative = (column, alternative) => {
    setMappingDecisions(prev => ({
      ...prev,
      [column]: { ...prev[column], selectedMapping: alternative }
    }));
  };

  const handleFinalSubmit = () => {
    const acceptedMappings = {};
    Object.keys(mappingDecisions).forEach(col => {
      if (mappingDecisions[col].accepted) {
        acceptedMappings[col] = mappingDecisions[col].selectedMapping;
      }
    });

    const transformedData = csvData.map(row => {
      const newRow = { ...row };
      selectedColumns.forEach(col => {
        const cellValue = row[col];
        if (cellValue && acceptedMappings[cellValue.trim()]) {
          newRow[col] = acceptedMappings[cellValue.trim()];
        }
      });
      return newRow;
    });

    const csv = Papa.unparse(transformedData);
    setTransformedCSV(csv);
    setSuccess(`Successfully mapped ${Object.keys(acceptedMappings).length} values!`);
  };

  const downloadCSV = () => {
    const blob = new Blob([transformedCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mapped_${file.name}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFile(null);
    setCsvData(null);
    setHeaders([]);
    setSelectedColumns([]);
    setSuggestions(null);
    setMappingDecisions({});
    setTransformedCSV(null);
    setError('');
    setSuccess('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (uploadedFile) => {
    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }

    setFile(uploadedFile);
    setError('');
    setSuccess('');
    setLoading(true);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data?.length > 0) {
          setCsvData(results.data);
          const allHeaders = Object.keys(results.data[0]).map(h => h.trim());
          const filteredHeaders = allHeaders.filter(h => h === 'Variable / Field Name');
          setHeaders(filteredHeaders);
          setSelectedColumns([]);
          setLoading(false);
        } else {
          setError('CSV file is empty or invalid');
          setLoading(false);
        }
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
        setLoading(false);
      }
    });
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { num: 1, label: 'Upload' },
        { num: 2, label: 'Select' },
        { num: 3, label: 'Review' }
      ].map((s, idx) => (
        <React.Fragment key={s.num}>
          <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step > s.num ? 'bg-blue-600 text-white' :
              step === s.num ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600' :
                'bg-gray-100 text-gray-400'
              }`}>
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
          </div>
          {idx < 2 && (
            <div className={`w-12 h-0.5 transition-all duration-300 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FieldForge</h1>
              <p className="text-xs text-gray-500">AI-powered field standardization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <StepIndicator />

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="p-8">
            {/* Step 1: File Upload */}
            {step === 1 && !file && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${isDragging
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => processFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-blue-500 scale-110' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    {isDragging ? 'Drop your file here' : 'Upload your CSV file'}
                  </p>
                  <p className="text-gray-500 mb-4">Drag and drop or click to browse</p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                    Select CSV File
                  </span>
                </label>
              </div>
            )}

            {/* Step 2: Column Selection */}
            {(step === 1 || step === 2) && file && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {csvData ? `${csvData.length.toLocaleString()} rows • ${headers.length} columns available` : 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { resetAll(); setStep(1); }}
                    className="p-2 hover:bg-white/80 rounded-lg transition-colors group"
                    title="Remove file"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>

                {headers.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Select Columns to Normalize
                      </h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {selectedColumns.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {headers.filter(hasValidData).map((header) => (
                        <button
                          key={header}
                          onClick={() => { toggleColumn(header); setStep(2); }}
                          className={`p-5 rounded-xl border-2 text-left transition-all duration-200 group ${selectedColumns.includes(header)
                            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 truncate pr-2">{header}</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedColumns.includes(header)
                              ? 'bg-blue-600'
                              : 'bg-gray-100 group-hover:bg-blue-100'
                              }`}>
                              {selectedColumns.includes(header) && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {getColumnSample(header).filter(v => v !== null && v !== undefined && v !== '').length} sample values
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitColumns}
                  disabled={loading || selectedColumns.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing with AI...</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Get AI Suggestions</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </>
            )}

            {/* Step 3: Review Suggestions */}
            {step === 3 && suggestions && (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Review AI Suggestions</h2>
                      <p className="text-sm text-gray-500 mt-1">Accept or reject each mapping, choose alternatives if needed</p>
                    </div>
                    <button
                      onClick={() => { setStep(2); setSuggestions(null); setMappingDecisions({}); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to selection
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.keys(suggestions).map((originalColumn) => {
                      const suggestion = suggestions[originalColumn];
                      const decision = mappingDecisions[originalColumn];

                      return (
                        <div
                          key={originalColumn}
                          className={`border-2 rounded-xl p-5 transition-all duration-200 flex flex-col ${decision.accepted
                            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                            : 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50'
                            }`}
                        >
                          {/* Original field name */}
                          <div className="flex items-start justify-between gap-2 mb-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Original</p>
                              <p className="font-mono text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200 truncate" title={originalColumn}>
                                {originalColumn}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleAcceptance(originalColumn)}
                              className={`p-2 rounded-lg transition-all flex-shrink-0 ${decision.accepted
                                ? 'bg-green-200 hover:bg-green-300 text-green-700'
                                : 'bg-red-200 hover:bg-red-300 text-red-700'
                                }`}
                              title={decision.accepted ? 'Click to reject' : 'Click to accept'}
                            >
                              {decision.accepted ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Arrow and suggested name */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <div className="flex-1 h-px bg-gray-200" />
                              <ArrowRight className="w-4 h-4" />
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <p className="text-xs text-gray-500 mb-1">Normalized</p>
                            <p className={`font-medium text-sm px-3 py-2 rounded-lg truncate ${decision.accepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`} title={decision.selectedMapping}>
                              {decision.selectedMapping}
                            </p>
                          </div>

                          {/* Alternatives */}
                          {suggestion.alternatives.length > 0 && (
                            <div className="mt-auto pt-3 border-t border-gray-200/50">
                              <p className="text-xs text-gray-500 mb-2">Alternatives</p>
                              <div className="flex flex-wrap gap-1.5">
                                {[suggestion.primary, ...suggestion.alternatives].map((alt) => (
                                  <button
                                    key={alt}
                                    onClick={() => selectAlternative(originalColumn, alt)}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all truncate max-w-full ${decision.selectedMapping === alt
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                                      }`}
                                    title={alt}
                                  >
                                    {alt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary bar */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 mb-6 flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">
                        <strong>{Object.values(mappingDecisions).filter(d => d.accepted).length}</strong> accepted
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="text-sm text-gray-700">
                        <strong>{Object.values(mappingDecisions).filter(d => !d.accepted).length}</strong> rejected
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Object.keys(suggestions).length} total mappings
                  </span>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={transformedCSV !== null}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 hover:shadow-xl mb-4"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {transformedCSV ? 'Mappings Applied ✓' : 'Apply Mappings'}
                </button>

                {transformedCSV && (
                  <div className="space-y-3">
                    <button
                      onClick={downloadCSV}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25"
                    >
                      <Download className="w-5 h-5" />
                      Download Normalized CSV
                    </button>
                    <button
                      onClick={() => { setStep(1); resetAll(); }}
                      className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Start Over
                    </button>
                  </div>
                )}
              </>
            )}

            {error && (
              <Alert className="mt-6 border-red-200 bg-red-50 rounded-xl">
                <AlertDescription className="text-red-800 flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-6 border-green-200 bg-green-50 rounded-xl">
                <AlertDescription className="text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>FieldForge — Powered by IBE</p>
        </footer>
      </main>
    </div>
  );
}


