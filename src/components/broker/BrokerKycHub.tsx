import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck,
  Building,
  User,
  Calendar,
  Lock,
  RefreshCw,
  Mail,
  ChevronRight,
  Eye,
  AlertCircle,
  Hash,
  MapPin,
  Globe2
} from 'lucide-react';
import {
  analyzeDocument,
  DocumentAnalysisResponse,
  evaluateExpirationDate
} from '../../lib/documentIntelligenceApi';

interface BrokerKycHubProps {
  brokerId?: string;
  brokerEmail?: string;
  brokerName?: string;
  onKycComplete?: (docType: string, result: DocumentAnalysisResponse) => void;
}

interface KycDocumentCategory {
  id: 'passport' | 'incorporation' | 'broker_license' | 'utility_bill';
  title: string;
  docType: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  isOptional?: boolean;
}

export const BrokerKycHub: React.FC<BrokerKycHubProps> = ({
  brokerId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  brokerEmail = 'broker@15dwings.com.ng',
  brokerName = 'Precious Ubadike',
  onKycComplete
}) => {
  const categories: KycDocumentCategory[] = [
    {
      id: 'passport',
      title: 'Principal International Passport',
      docType: 'International Passport',
      description: 'Clear photographic scan of biometric passport data page for VIP principal clearance.',
      icon: <User className="w-5 h-5 text-purple-600" />,
      badge: 'Primary ID'
    },
    {
      id: 'incorporation',
      title: 'Certificate of Incorporation / Registry',
      docType: 'Corporate Certificate of Incorporation',
      description: 'Official corporate registration certificate or commercial register extract (e.g. Companies House, Delaware, CAC, KVK, etc.).',
      icon: <Building className="w-5 h-5 text-indigo-600" />,
      badge: 'Corporate Entity'
    },
    {
      id: 'broker_license',
      title: 'Aviation Broker Accreditation',
      docType: 'Aviation Broker License',
      description: 'Civil Aviation Authority (CAA / FAA / EASA / NCAA / IATA) charter broker authorization or license permit (optional for global operators).',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      badge: 'Optional',
      isOptional: true
    },
    {
      id: 'utility_bill',
      title: 'Proof of Business Address',
      docType: 'Proof of Business Address',
      description: 'Recent commercial tenancy agreement, utility invoice, or official corporate bank statement issued within 90 days.',
      icon: <FileText className="w-5 h-5 text-amber-600" />,
      badge: 'Address Proof'
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState<KycDocumentCategory>(categories[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Passport specific fields
  const [passportFullName, setPassportFullName] = useState(brokerName);
  const [passportNumber, setPassportNumber] = useState('');
  const [passportCountry, setPassportCountry] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');

  // Incorporation certificate specific fields
  const [companyName, setCompanyName] = useState('15D Executive Aviation Brokerage');
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState('');
  const [incorporationCountry, setIncorporationCountry] = useState('');
  const [incorporationDate, setIncorporationDate] = useState('');

  // Aviation broker license specific fields
  const [licenseEntityName, setLicenseEntityName] = useState(brokerName);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [aviationAuthority, setAviationAuthority] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');

  // Proof of business address specific fields
  const [addressEntityName, setAddressEntityName] = useState(brokerName);
  const [businessAddress, setBusinessAddress] = useState('');
  const [addressIssueDate, setAddressIssueDate] = useState('');

  // Execution states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryResults, setCategoryResults] = useState<Record<string, DocumentAnalysisResponse>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage('File exceeds the maximum 20 MB size limit. Please upload a smaller file.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      setAnalysisResult(null);
    }
  };

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please choose a document file to upload and analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep('Encrypting & uploading to Cloudflare R2 storage...');

    try {
      // Build tailored entered_details for deterministic validation based on category
      const enteredDetails: Record<string, string> = {};

      if (selectedCategory.id === 'passport') {
        if (passportFullName.trim()) {
          enteredDetails.person_name = passportFullName.trim();
          enteredDetails.expected_fullname = passportFullName.trim();
        }
        if (passportNumber.trim()) enteredDetails.certificate_number = passportNumber.trim();
        if (passportCountry.trim()) enteredDetails.country = passportCountry.trim();
        if (passportExpiry.trim()) enteredDetails.expiry_date = passportExpiry.trim();
      } else if (selectedCategory.id === 'incorporation') {
        if (companyName.trim()) {
          enteredDetails.company_name = companyName.trim();
          enteredDetails.person_name = companyName.trim();
          enteredDetails.expected_fullname = companyName.trim();
        }
        if (companyRegistrationNumber.trim()) enteredDetails.certificate_number = companyRegistrationNumber.trim();
        if (incorporationCountry.trim()) enteredDetails.country = incorporationCountry.trim();
        if (incorporationDate.trim()) enteredDetails.issue_date = incorporationDate.trim();
      } else if (selectedCategory.id === 'broker_license') {
        if (licenseEntityName.trim()) {
          enteredDetails.person_name = licenseEntityName.trim();
          enteredDetails.expected_fullname = licenseEntityName.trim();
        }
        if (licenseNumber.trim()) enteredDetails.certificate_number = licenseNumber.trim();
        if (aviationAuthority.trim()) enteredDetails.issuing_authority = aviationAuthority.trim();
        if (licenseExpiry.trim()) enteredDetails.expiry_date = licenseExpiry.trim();
      } else if (selectedCategory.id === 'utility_bill') {
        if (addressEntityName.trim()) {
          enteredDetails.person_name = addressEntityName.trim();
          enteredDetails.expected_fullname = addressEntityName.trim();
        }
        if (businessAddress.trim()) enteredDetails.address = businessAddress.trim();
        if (addressIssueDate.trim()) enteredDetails.issue_date = addressIssueDate.trim();
      }

      setTimeout(() => {
        setAnalysisStep('Executing certified document verification & text extraction...');
      }, 1000);

      setTimeout(() => {
        setAnalysisStep('Evaluating Deterministic Validation Gate & Expiration Audit...');
      }, 2500);

      const result = await analyzeDocument({
        file: selectedFile,
        scope: 'operator',
        stakeholder_type: 'operator',
        stakeholder_id: brokerId,
        operator_id: brokerId,
        doc_type: selectedCategory.docType,
        entered_details: Object.keys(enteredDetails).length > 0 ? enteredDetails : undefined,
        validation_context: {
          broker_id: brokerId,
          broker_email: brokerEmail,
          category: selectedCategory.id,
          purpose: 'broker_kyc_clearance'
        },
        brokerEmail,
        brokerName
      });

      setAnalysisResult(result);
      setCategoryResults((prev) => ({
        ...prev,
        [selectedCategory.id]: result
      }));

      onKycComplete?.(selectedCategory.docType, result);
    } catch (err: any) {
      console.error('KYC analysis error:', err);
      setErrorMessage(err.message || 'Error executing document intelligence analysis.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const expiration = analysisResult?.expirationCheck;

  return (
    <div className="bg-white rounded-3xl border border-purple-200/90 shadow-xl overflow-hidden text-left font-sans">
      {/* Executive Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-purple-300 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-400/20 border border-purple-300/30 text-[10px] font-mono uppercase tracking-widest text-purple-200 font-bold">
                  Document Intelligence v3.2.0
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Bank-Grade Encryption Vault
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                Broker International KYC Clearance Hub
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-purple-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-300" />
              <span>Audit Relay: ops@15dwings.com.ng</span>
            </span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-purple-200/90 mt-3 max-w-2xl leading-relaxed">
          Upload certified international identity and aviation brokerage credentials. All documents are encrypted in high-security regulatory vaults, deterministically verified for authenticity and expiration dates, and automatically dispatched to clearance operations.
        </p>

        {/* 4 Category Segmented Switcher */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 pt-4 border-t border-white/10">
          {categories.map((cat) => {
            const hasResult = categoryResults[cat.id];
            const isSelected = selectedCategory.id === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedFile(null);
                  setAnalysisResult(categoryResults[cat.id] || null);
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-950 border-white shadow-lg font-bold'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                    cat.isOptional
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-purple-500/20 text-purple-200'
                  }`}>
                    {cat.badge}
                  </span>
                  {hasResult && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <p className="text-xs font-bold truncate">{cat.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form & Analysis Canvas */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload & Deterministic Gate Form */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {selectedCategory.icon}
                  <h4 className="text-sm font-bold text-slate-900">{selectedCategory.title}</h4>
                </div>
                {selectedCategory.isOptional && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedCategory.description}
              </p>
            </div>

            <form onSubmit={handleRunAnalysis} className="space-y-4">
              {/* File Drop Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Select Document File (PDF, JPEG, PNG, WEBP, HEIC • Max 20MB)
                </label>
                <div className="relative border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 text-center transition-all bg-purple-50/20 group">
                  <input
                    type="file"
                    required={!selectedFile}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-purple-900">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Click to browse or drop certified scan here
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Preserved in encrypted compliance vault
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tailored Category Fields (No 'Expected' in labels) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Document Context & Verification Fields</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Zero-Hallucination Gate</span>
                </div>

                {/* 1. PASSPORT FIELDS */}
                {selectedCategory.id === 'passport' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Precious Ubadike"
                        value={passportFullName}
                        onChange={(e) => setPassportFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. A09823412"
                        value={passportNumber}
                        onChange={(e) => setPassportNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Issuing Country
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nigeria, United Kingdom, USA"
                        value={passportCountry}
                        onChange={(e) => setPassportCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        value={passportExpiry}
                        onChange={(e) => setPassportExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}

                {/* 2. CORPORATE CERTIFICATE FIELDS */}
                {selectedCategory.id === 'incorporation' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Registered Company / Brokerage Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15D Executive Aviation Brokerage Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Company Registration / RC Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RC-192842 or 12345678"
                        value={companyRegistrationNumber}
                        onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Country of Incorporation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. United Kingdom, USA, Nigeria, UAE"
                        value={incorporationCountry}
                        onChange={(e) => setIncorporationCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Registration / Incorporation Date
                      </label>
                      <input
                        type="date"
                        value={incorporationDate}
                        onChange={(e) => setIncorporationDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}

                {/* 3. AVIATION BROKER ACCREDITATION FIELDS (OPTIONAL) */}
                {selectedCategory.id === 'broker_license' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Accredited Broker / Agency Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15D Executive Aviation Brokerage"
                        value={licenseEntityName}
                        onChange={(e) => setLicenseEntityName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Aviation License / Permit Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CAA/BRK-9901 or FAA/CERT-4410"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Aviation Authority (CAA / FAA / EASA / NCAA / IATA)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FAA, CAA, EASA, NCAA, IATA"
                        value={aviationAuthority}
                        onChange={(e) => setAviationAuthority(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        License Expiration Date
                      </label>
                      <input
                        type="date"
                        value={licenseExpiry}
                        onChange={(e) => setLicenseExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}

                {/* 4. PROOF OF ADDRESS FIELDS */}
                {selectedCategory.id === 'utility_bill' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Company or Principal Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Precious Ubadike / 15D Wings"
                        value={addressEntityName}
                        onChange={(e) => setAddressEntityName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Registered Physical Business Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15D Wings Executive Aviation Terminal, VIP Apron"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Document Statement / Issue Date (Must be within 90 days)
                      </label>
                      <input
                        type="date"
                        value={addressIssueDate}
                        onChange={(e) => setAddressIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-3.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{analysisStep || 'Analyzing Document...'}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Upload & Execute Intelligence Verification</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: AI Extraction & Deterministic Result */}
          <div className="lg:col-span-6 space-y-4">
            {isAnalyzing && (
              <div className="p-8 rounded-2xl bg-purple-50/50 border border-purple-200 text-center space-y-4 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 flex items-center justify-center mx-auto text-purple-600 shadow-sm">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Executing 15D Wings Document Pipeline
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    {analysisStep}
                  </p>
                </div>
              </div>
            )}

            {!isAnalyzing && analysisResult && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {analysisResult.validation?.decision === 'CONSISTENT_WITH_SUBMITTED_DETAILS' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>CONSISTENT / VERIFIED</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{analysisResult.validation?.decision || 'REVIEW REQUIRED'}</span>
                      </span>
                    )}

                    {/* Expiration Status Pill */}
                    {expiration && expiration.status !== 'NO_EXPIRY_DETECTED' && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 border ${
                        expiration.isExpired
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : expiration.isExpiringSoon
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {expiration.isExpired
                            ? `EXPIRED (${expiration.expiryDate})`
                            : expiration.isExpiringSoon
                            ? `EXPIRING SOON (${expiration.daysRemaining}d)`
                            : `VALID: ${expiration.expiryDate || 'ACTIVE'}`}
                        </span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Event: {analysisResult.event_id?.substring(0, 10)}...
                  </span>
                </div>

                {/* Extracted Structured Data Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Identified Name / Entity</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">
                      {analysisResult.extraction?.structured_data?.person_name || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Certificate / ID #</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5 truncate">
                      {analysisResult.extraction?.structured_data?.certificate_number || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Issue Date</span>
                    <p className="font-mono text-slate-800 mt-0.5">
                      {analysisResult.extraction?.structured_data?.issue_date || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expiration Date</span>
                    <p className={`font-mono font-bold mt-0.5 ${expiration?.isExpired ? 'text-red-600' : 'text-emerald-700'}`}>
                      {analysisResult.extraction?.structured_data?.expiry_date || 'Permanent / Current'}
                    </p>
                  </div>
                </div>

                {/* Secure Storage Vault Confirmation */}
                {analysisResult.storage?.url && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="text-purple-900 font-medium">
                        Preserved in Private Compliance Vault (<code className="font-mono text-[11px]">{analysisResult.storage.scope}</code>)
                      </span>
                    </div>
                    <a
                      href={analysisResult.storage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Blob</span>
                    </a>
                  </div>
                )}

                {/* Telemetry Mailer Notification Confirmation */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Audit Notification Telemetry Dispatched:</span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Complete OCR payload and expiration report relayed to <code className="font-mono font-bold">ops@15dwings.com.ng</code> & operations desk.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isAnalyzing && !analysisResult && (
              <div className="p-12 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="max-w-xs mx-auto">
                  <h4 className="text-sm font-bold text-slate-900">No Document Analyzed Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a document on the left to execute certified verification and compliance extraction.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
