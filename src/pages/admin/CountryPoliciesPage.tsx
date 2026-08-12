import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchCountries } from '../../store/slices/settingsSlice';
import { payrollApi } from '../../services/api';
import { Globe, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const CountryPoliciesPage = () => {
    const dispatch = useAppDispatch();
    const { countries, loading } = useAppSelector(
        (state) => state.settings ?? { countries: [], loading: false }
    );
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [msg, setMsg] = useState('');
    const [form, setForm] = useState({
        countryCode: '',
        countryName: '',
        currency: '',
        flagEmoji: '',
        socialContributionLabel: '',
        socialContributionEmployeeRate: '',
        socialContributionEmployerRate: '',
        hasProgressiveTax: false,
        hasAgeBased: false,
    });

    useEffect(() => {
        dispatch(fetchCountries());
    }, [dispatch]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await payrollApi.post('/api/countrypolicy', {
                ...form,
                socialContributionEmployeeRate: parseFloat(form.socialContributionEmployeeRate),
                socialContributionEmployerRate: parseFloat(form.socialContributionEmployerRate),
            });
            setMsg('Country policy created successfully!');
            setShowForm(false);
            dispatch(fetchCountries());
            setForm({
                countryCode: '', countryName: '', currency: '', flagEmoji: '',
                socialContributionLabel: '', socialContributionEmployeeRate: '',
                socialContributionEmployerRate: '', hasProgressiveTax: false, hasAgeBased: false,
            });
        } catch (error: any) {
            setMsg(error.response?.data?.message || 'Failed to create country policy.');
        }
    };

    const handleDeactivate = async (countryCode: string) => {
        if (window.confirm(`Deactivate ${countryCode}?`)) {
            try {
                await payrollApi.put(`/api/countrypolicy/${countryCode}/deactivate`);
                dispatch(fetchCountries());
            } catch {
                setMsg('Failed to deactivate country.');
            }
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Country Policies</h2>
                    <p className="text-gray-500 text-sm">Manage payroll policies for each country</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                    <Plus size={16} />
                    Add Country
                </button>
            </div>

            {msg && (
                <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {msg}
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Loading...</div>
                ) : countries.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <Globe size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No country policies found.</p>
                    </div>
                ) : (
                    countries.map((country) => (
                        <div key={country.countryCode} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpanded(expanded === country.countryCode ? null : country.countryCode)}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{country.flagEmoji}</span>
                                    <div>
                                        <p className="font-bold text-gray-800">{country.countryName}</p>
                                        <p className="text-sm text-gray-500">{country.currency} · {country.socialContributionLabel}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-2">
                                        {country.hasProgressiveTax && (
                                            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">Progressive Tax</span>
                                        )}
                                        {country.hasAgeBased && (
                                            <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">Age-based</span>
                                        )}
                                        <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full">Active</span>
                                    </div>
                                    {expanded === country.countryCode
                                        ? <ChevronUp size={18} className="text-gray-400" />
                                        : <ChevronDown size={18} className="text-gray-400" />
                                    }
                                </div>
                            </div>

                            {expanded === country.countryCode && (
                                <div className="border-t border-gray-100 p-5">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-3">Payroll Policy</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Currency</span>
                                                    <span className="font-medium">{country.currency}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Contribution Label</span>
                                                    <span className="font-medium">{country.socialContributionLabel}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Employee Rate</span>
                                                    <span className="font-medium text-red-500">{country.socialContributionEmployeeRate}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Employer Rate</span>
                                                    <span className="font-medium text-blue-500">{country.socialContributionEmployerRate}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Progressive Tax</span>
                                                    <span className={`font-medium ${country.hasProgressiveTax ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {country.hasProgressiveTax ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Age-based</span>
                                                    <span className={`font-medium ${country.hasAgeBased ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {country.hasAgeBased ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            {country.hasProgressiveTax && country.taxBrackets.length > 0 && (
                                                <>
                                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Tax Brackets</h4>
                                                    <div className="space-y-1">
                                                        {country.taxBrackets.map((t) => (
                                                            <div key={t.id} className="flex justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg">
                                                                <span className="text-gray-500">{t.description}</span>
                                                                <span className="font-semibold text-indigo-600">{t.taxRate}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                            {country.hasAgeBased && country.ageBrackets.length > 0 && (
                                                <>
                                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Age Brackets</h4>
                                                    <div className="space-y-1">
                                                        {country.ageBrackets.map((a) => (
                                                            <div key={a.id} className="text-xs bg-gray-50 px-3 py-1.5 rounded-lg">
                                                                <p className="text-gray-500">{a.description}</p>
                                                                <div className="flex justify-between mt-0.5">
                                                                    <span className="text-red-500">Employee: {a.employeeRate}%</span>
                                                                    <span className="text-blue-500">Employer: {a.employerRate}%</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleDeactivate(country.countryCode)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Deactivate Country
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Country Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Add Country Policy</h3>
                            <button onClick={() => setShowForm(false)}>
                                <X size={20} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Country Code (e.g. TH)</label>
                                    <input type="text" required maxLength={2}
                                        value={form.countryCode}
                                        onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Country Name</label>
                                    <input type="text" required value={form.countryName}
                                        onChange={(e) => setForm({ ...form, countryName: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Currency (e.g. THB)</label>
                                    <input type="text" required value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Flag Emoji</label>
                                    <input type="text" required placeholder="🇹🇭" value={form.flagEmoji}
                                        onChange={(e) => setForm({ ...form, flagEmoji: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Social Contribution Label</label>
                                <input type="text" required value={form.socialContributionLabel}
                                    onChange={(e) => setForm({ ...form, socialContributionLabel: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Employee Rate (%)</label>
                                    <input type="number" step="0.01" required value={form.socialContributionEmployeeRate}
                                        onChange={(e) => setForm({ ...form, socialContributionEmployeeRate: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Employer Rate (%)</label>
                                    <input type="number" step="0.01" required value={form.socialContributionEmployerRate}
                                        onChange={(e) => setForm({ ...form, socialContributionEmployerRate: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={form.hasProgressiveTax}
                                        onChange={(e) => setForm({ ...form, hasProgressiveTax: e.target.checked })} />
                                    Progressive Tax
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={form.hasAgeBased}
                                        onChange={(e) => setForm({ ...form, hasAgeBased: e.target.checked })} />
                                    Age-based Contribution
                                </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                                    Add Country
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CountryPoliciesPage;