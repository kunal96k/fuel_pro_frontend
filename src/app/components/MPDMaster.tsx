import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchProducts, fetchTanks, Product, Tank } from '../services/api';
import { toast } from 'sonner';

interface Nozzle {
  id: string;
  nozzleName: string;
  fuelType: string;
  connectedTank: string;
}

interface MPD {
  id: string;
  mpdName: string;
  numberOfNozzles: number;
  nozzles: Nozzle[];
}

export function MPDMaster() {
  const [mpds, setMpds] = useState<MPD[]>(() => {
    try {
      const stored = localStorage.getItem('mpds_data');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [expandedMPDs, setExpandedMPDs] = useState<string[]>([]);
  const [fuelProducts, setFuelProducts] = useState<Product[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const prodRes = await fetchProducts({ size: 1000, category: 'Fuel' });
        setFuelProducts(prodRes.content.filter(p => p.category?.toLowerCase() === 'fuel'));
        
        const tankRes = await fetchTanks({ size: 1000 });
        setTanks(tankRes.content);
      } catch (err) {
        console.error('Failed to load dependencies in MPDMaster:', err);
      }
    };
    loadDependencies();
  }, []);

  // Persist + broadcast MPD list whenever it changes
  useEffect(() => {
    try { localStorage.setItem('mpds_data', JSON.stringify(mpds)); } catch {}
    (window as any).__mpds_data = mpds;
    window.dispatchEvent(new CustomEvent('mpds-updated', { detail: mpds }));
  }, [mpds]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMPD, setEditingMPD] = useState<MPD | null>(null);
  const [formData, setFormData] = useState({
    mpdName: '',
    numberOfNozzles: '4',
  });
  const [nozzleData, setNozzleData] = useState<Nozzle[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedMPDs(prev =>
      prev.includes(id) ? prev.filter(mpdId => mpdId !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    setFormData({
      mpdName: '',
      numberOfNozzles: '4',
    });
    setNozzleData([
      { id: '1', nozzleName: 'Nozzle 1', fuelType: '', connectedTank: '' },
      { id: '2', nozzleName: 'Nozzle 2', fuelType: '', connectedTank: '' },
      { id: '3', nozzleName: 'Nozzle 3', fuelType: '', connectedTank: '' },
      { id: '4', nozzleName: 'Nozzle 4', fuelType: '', connectedTank: '' },
    ]);
    setEditingMPD(null);
    setShowAddDialog(true);
  };

  const handleEdit = (mpd: MPD) => {
    setFormData({
      mpdName: mpd.mpdName,
      numberOfNozzles: mpd.numberOfNozzles.toString(),
    });
    setNozzleData(mpd.nozzles);
    setEditingMPD(mpd);
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this MPD?')) {
      setMpds(mpds.filter(mpd => mpd.id !== id));
    }
  };

  const handleNumberOfNozzlesChange = (value: string) => {
    const count = parseInt(value);
    setFormData({ ...formData, numberOfNozzles: value });

    const currentNozzles = [...nozzleData];
    const newNozzles: Nozzle[] = [];

    for (let i = 0; i < count; i++) {
      if (currentNozzles[i]) {
        newNozzles.push(currentNozzles[i]);
      } else {
        newNozzles.push({
          id: (i + 1).toString(),
          nozzleName: `Nozzle ${i + 1}`,
          fuelType: '',
          connectedTank: '',
        });
      }
    }

    setNozzleData(newNozzles);
  };

  const updateNozzle = (index: number, field: keyof Nozzle, value: string) => {
    const updated = [...nozzleData];
    if (field === 'fuelType') {
      const currentTankName = updated[index].connectedTank;
      const selectedTank = tanks.find(t => t.tankName === currentTankName);
      const matches = selectedTank && selectedTank.fuelType?.trim().toLowerCase() === value.trim().toLowerCase();
      updated[index] = {
        ...updated[index],
        fuelType: value,
        connectedTank: matches ? currentTankName : ''
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setNozzleData(updated);
  };

  const handleSave = () => {
    if (!formData.mpdName) {
      toast.error('Please enter MPD name');
      return;
    }

    const duplicate = mpds.find(
      m => m.mpdName.trim().toLowerCase() === formData.mpdName.trim().toLowerCase() &&
      (!editingMPD || m.id !== editingMPD.id)
    );
    if (duplicate) {
      toast.warning(`MPD with name "${formData.mpdName}" already exists!`);
      return;
    }

    const hasEmptyFields = nozzleData.some(n => !n.fuelType || !n.connectedTank);
    if (hasEmptyFields) {
      toast.error('Please fill in all nozzle details');
      return;
    }

    if (editingMPD) {
      setMpds(mpds.map(mpd =>
        mpd.id === editingMPD.id
          ? {
              ...mpd,
              mpdName: formData.mpdName,
              numberOfNozzles: parseInt(formData.numberOfNozzles),
              nozzles: nozzleData,
            }
          : mpd
      ));
      toast.success('MPD updated successfully!');
    } else {
      const newMPD: MPD = {
        id: Date.now().toString(),
        mpdName: formData.mpdName,
        numberOfNozzles: parseInt(formData.numberOfNozzles),
        nozzles: nozzleData,
      };
      setMpds([...mpds, newMPD]);
      toast.success('MPD created successfully!');
    }

    setShowAddDialog(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">MPD Master</h1>
          <p className="text-muted-foreground">Manage Multi Product Dispensers, nozzles, and tank connections</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New MPD
        </Button>
      </div>

      <div className="space-y-4">
        {mpds.map((mpd) => {
          const isExpanded = expandedMPDs.includes(mpd.id);
          return (
            <div key={mpd.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                <button
                  onClick={() => toggleExpanded(mpd.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-medium">{mpd.mpdName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {mpd.numberOfNozzles} Nozzles
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(mpd)}
                    className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(mpd.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/20 border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-medium">Nozzle</th>
                        <th className="text-left p-4 font-medium">Fuel Type</th>
                        <th className="text-left p-4 font-medium">Connected Tank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {mpd.nozzles.map((nozzle) => (
                        <tr key={nozzle.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium">{nozzle.nozzleName}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              nozzle.fuelType === 'Petrol' ? 'bg-green-500/10 text-green-500' :
                              nozzle.fuelType === 'Diesel' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {nozzle.fuelType}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{nozzle.connectedTank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {mpds.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">No MPDs configured. Click "Add New MPD" to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMPD ? 'Edit MPD' : 'Add New MPD'}</DialogTitle>
            <DialogDescription>
              {editingMPD ? 'Update MPD configuration' : 'Configure a new Multi Product Dispenser'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mpdName">MPD Name <span className="text-red-500">*</span></Label>
              <Input
                id="mpdName"
                value={formData.mpdName}
                onChange={(e) => setFormData({ ...formData, mpdName: e.target.value })}
                placeholder="Enter MPD name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numberOfNozzles">Number of Nozzles <span className="text-red-500">*</span></Label>
              <Select
                value={formData.numberOfNozzles}
                onValueChange={handleNumberOfNozzlesChange}
              >
                <SelectTrigger id="numberOfNozzles">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Nozzle</SelectItem>
                  <SelectItem value="2">2 Nozzles</SelectItem>
                  <SelectItem value="3">3 Nozzles</SelectItem>
                  <SelectItem value="4">4 Nozzles</SelectItem>
                  <SelectItem value="5">5 Nozzles</SelectItem>
                  <SelectItem value="6">6 Nozzles</SelectItem>
                  <SelectItem value="7">7 Nozzles</SelectItem>
                  <SelectItem value="8">8 Nozzles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-4 mt-2">
              <h4 className="font-medium mb-4">Nozzle Configuration</h4>
              <div className="space-y-4">
                {nozzleData.map((nozzle, index) => (
                  <div key={nozzle.id} className="grid gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="font-medium text-sm">{nozzle.nozzleName}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor={`fuel-${index}`} className="text-xs">Fuel Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={nozzle.fuelType}
                          onValueChange={(value) => updateNozzle(index, 'fuelType', value)}
                        >
                          <SelectTrigger id={`fuel-${index}`}>
                            <SelectValue placeholder="Select fuel" />
                          </SelectTrigger>
                          <SelectContent>
                            {fuelProducts.length === 0 ? (
                              <SelectItem value="NO_PRODUCTS" disabled>
                                No fuel products found
                              </SelectItem>
                            ) : (
                              fuelProducts.map((prod) => (
                                <SelectItem key={prod.id} value={prod.name}>
                                  {prod.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`tank-${index}`} className="text-xs">Connected Tank <span className="text-red-500">*</span></Label>
                        <Select
                          value={nozzle.connectedTank}
                          onValueChange={(value) => updateNozzle(index, 'connectedTank', value)}
                        >
                          <SelectTrigger id={`tank-${index}`}>
                            <SelectValue placeholder="Select tank" />
                          </SelectTrigger>
                          <SelectContent>
                            {!nozzle.fuelType ? (
                              <SelectItem value="SELECT_FUEL_FIRST" disabled>
                                Select fuel type first
                              </SelectItem>
                            ) : (
                              (() => {
                                const filteredTanks = tanks.filter(
                                  (t) => t.fuelType?.trim().toLowerCase() === nozzle.fuelType.trim().toLowerCase()
                                );
                                return filteredTanks.length === 0 ? (
                                  <SelectItem value="NO_TANKS" disabled>
                                    No tanks found for {nozzle.fuelType}
                                  </SelectItem>
                                ) : (
                                  filteredTanks.map((tank) => (
                                    <SelectItem key={tank.id} value={tank.tankName}>
                                      {tank.tankName}
                                    </SelectItem>
                                  ))
                                );
                              })()
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingMPD ? 'Update' : 'Add MPD'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
