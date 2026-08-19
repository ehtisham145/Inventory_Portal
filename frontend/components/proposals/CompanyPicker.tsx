"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/Input";
import { CompanyInput } from "@/services/companies";
import { Company } from "@/types";

export const NEW_COMPANY_VALUE = "__new__";

interface CompanyPickerProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  newCompanyData: CompanyInput;
  onNewCompanyDataChange: (data: CompanyInput) => void;
  errors: Record<string, string>;
}

/** Type a company name to search existing companies (pick one from the suggestions), or just
 * keep filling in the fields below to create a brand-new one — no separate "create" step. */
export function CompanyPicker({
  companies,
  selectedCompanyId,
  onSelectCompany,
  newCompanyData,
  onNewCompanyDataChange,
  errors,
}: CompanyPickerProps) {
  const isExisting = !!selectedCompanyId && selectedCompanyId !== NEW_COMPANY_VALUE;
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const [query, setQuery] = useState(newCompanyData.company_name);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExisting) setQuery(newCompanyData.company_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExisting]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const suggestions = query.trim()
    ? companies.filter((c) => c.company_name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    onSelectCompany(NEW_COMPANY_VALUE);
    onNewCompanyDataChange({ ...newCompanyData, company_name: value });
  };

  const handlePickSuggestion = (company: Company) => {
    setQuery(company.company_name);
    setShowSuggestions(false);
    onSelectCompany(company.id);
  };

  const handleChangeCompany = () => {
    onSelectCompany(NEW_COMPANY_VALUE);
    onNewCompanyDataChange({ ...newCompanyData, company_name: "" });
    setQuery("");
  };

  if (isExisting && selectedCompany) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Company</label>
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{selectedCompany.company_name}</p>
            <p className="truncate text-xs text-gray-500">
              {selectedCompany.contact_person} · {selectedCompany.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleChangeCompany}
            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
          >
            Change
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Using this existing company. The proposal will be sent to their review portal login automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative" ref={containerRef}>
        <Input
          label="Company Name"
          placeholder="Type to search existing companies, or enter a new name"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          error={errors.company || errors.company_name}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {suggestions.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => handlePickSuggestion(c)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{c.company_name}</span>
                  <span className="ml-2 text-xs text-gray-400">{c.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {query.trim() && suggestions.length === 0 && (
        <p className="-mt-2 text-xs text-gray-400">
          No existing company matches &quot;{query.trim()}&quot; — fill in the details below to create it.
        </p>
      )}

      <Input
        label="Contact Person Name"
        value={newCompanyData.contact_person}
        onChange={(e) => onNewCompanyDataChange({ ...newCompanyData, contact_person: e.target.value })}
        error={errors.contact_person}
      />
      <Input
        label="Email"
        type="email"
        value={newCompanyData.email}
        onChange={(e) => onNewCompanyDataChange({ ...newCompanyData, email: e.target.value })}
        error={errors.email}
      />
      <Input
        label="Phone"
        value={newCompanyData.phone}
        onChange={(e) => onNewCompanyDataChange({ ...newCompanyData, phone: e.target.value })}
      />
      <p className="text-xs text-gray-400">
        An invite email will be sent to this address so the company can set up their own login password.
      </p>
    </div>
  );
}
