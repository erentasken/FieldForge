'use client'
import React, { useState } from 'react';
import { Upload, X, CheckCircle2, Loader2, ArrowRight, Check, XCircle } from 'lucide-react';
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

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

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

          // Filter to only show "Variable / Field Name" and "Field Label"
          const filteredHeaders = allHeaders.filter(h =>
            h === 'Variable / Field Name'
          );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">CSV Column Mapper</h1>
            <p className="text-blue-100 mt-2">
              {step === 1 && 'Upload your CSV file'}
              {step === 2 && 'Select columns to map'}
              {step === 3 && 'Review and accept mapping suggestions'}
            </p>
          </div>

          <div className="p-8">
            {/* Step 1: File Upload */}
            {step === 1 && !file && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">Click to upload CSV file</p>
                  <p className="text-sm text-gray-500">Support for CSV files only</p>
                </label>
              </div>
            )}

            {/* Step 2: Column Selection */}
            {(step === 1 || step === 2) && file && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {csvData ? `${csvData.length} rows, ${headers.length} columns` : 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { resetAll(); setStep(1); }} className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {headers.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Select Columns ({selectedColumns.length} selected)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {headers.filter(hasValidData).map((header) => (
                        <button
                          key={header}
                          onClick={() => { toggleColumn(header); setStep(2); }}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${selectedColumns.includes(header)
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 truncate pr-2">{header}</span>
                            {selectedColumns.includes(header) && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {getColumnSample(header).filter(v => v !== null && v !== undefined && v !== '').length} values
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitColumns}
                  disabled={loading || selectedColumns.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Getting Suggestions...</>
                  ) : (
                    <>Continue<ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </>
            )}

            {/* Step 3: Review Suggestions */}
            {step === 3 && suggestions && (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Review Mapping Suggestions</h2>
                    <button onClick={() => { setStep(2); setSuggestions(null); setMappingDecisions({}); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      ← Back to selection
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Object.keys(suggestions).map((originalColumn) => {
                      const suggestion = suggestions[originalColumn];
                      const decision = mappingDecisions[originalColumn];

                      return (
                        <div key={originalColumn} className={`border-2 rounded-lg p-4 transition-all flex flex-col ${decision.accepted ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                          }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-300 truncate flex-1 mr-2">
                              {originalColumn}
                            </span>
                            <button
                              onClick={() => toggleAcceptance(originalColumn)}
                              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${decision.accepted ? 'bg-green-200 hover:bg-green-300' : 'bg-red-200 hover:bg-red-300'
                                }`}
                            >
                              {decision.accepted ? <Check className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                            </button>
                          </div>

                          <div className="mb-3">
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <p className="font-medium text-sm text-gray-900 text-center truncate">
                              {decision.selectedMapping}
                            </p>
                          </div>

                          {suggestion.alternatives.length > 0 && (
                            <div className="mt-auto">
                              <p className="text-xs text-gray-600 mb-2">Alternatives:</p>
                              <div className="flex flex-wrap gap-1">
                                {[suggestion.primary, ...suggestion.alternatives].map((alt) => (
                                  <button
                                    key={alt}
                                    onClick={() => selectAlternative(originalColumn, alt)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors truncate max-w-full ${decision.selectedMapping === alt
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
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

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>{Object.values(mappingDecisions).filter(d => d.accepted).length} of {Object.keys(suggestions).length}</strong> mappings accepted
                  </p>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={transformedCSV !== null}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {transformedCSV ? 'Mappings Confirmed ✓' : 'Confirm Mappings'}
                </button>

                {transformedCSV && (
                  <div className="space-y-3">
                    <button onClick={downloadCSV} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5 rotate-180" />Download Mapped CSV
                    </button>
                    <button onClick={() => { setStep(1); resetAll(); }} className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all">
                      Start Over
                    </button>
                  </div>
                )}
              </>
            )}

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


