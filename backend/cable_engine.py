import math

# Allowable maximums (can be taken from project settings in future)
DEFAULT_MAX_VDROP_PERCENT = {
	"LV": 5,
	"MV": 10,
	"CONTROL": 15,
}


def full_load_current_kw(load_kw, voltage, pf, eff):
	"""Calculate full load current from kW."""
	if voltage == 0 or pf == 0 or eff == 0:
		return 0
	return (load_kw * 1000) / (math.sqrt(3) * voltage * pf * eff)


def full_load_current_kva(load_kva, voltage):
	"""Calculate full load current from kVA."""
	if voltage == 0:
		return 0
	return (load_kva * 1000) / (math.sqrt(3) * voltage)


def derated_current(i_base, d_factors):
	"""Derate current based on multiple correction factors."""
	d_total = 1
	for f in d_factors:
		d_total *= f
	if d_total == 0:
		return float("inf")
	return i_base / d_total


def voltage_drop_percent(i_load, length, mv_per_a_m, voltage):
	"""Voltage drop calculation using mv/A/m method."""
	if voltage == 0:
		return 0
	return (math.sqrt(3) * i_load * length * mv_per_a_m / voltage) * 100


def short_circuit_check(i_sc, duration, k_const, csa):
	"""SC Check: Required area vs selected cable CSA."""
	try:
		a_required = (i_sc * math.sqrt(duration)) / k_const
		return a_required <= csa, a_required
	except:
		return False, 0

