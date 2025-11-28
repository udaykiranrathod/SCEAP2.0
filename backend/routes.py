from fastapi import APIRouter
from typing import List
from schemas import CableInput, CableOutput
from cable_engine import (
	full_load_current_kw,
	full_load_current_kva,
	derated_current,
	voltage_drop_percent,
	short_circuit_check,
)
from fastapi import UploadFile, File, HTTPException
import pandas as pd
import uuid
import os

router = APIRouter(prefix="/cable", tags=["Cable Sizing"])


@router.post("/size", response_model=CableOutput)
def size_cable(data: CableInput):

	# Determine base current
	if data.current > 0:
		i_base = data.current
	elif data.load_kw > 0:
		i_base = full_load_current_kw(data.load_kw, data.voltage, data.pf, data.eff)
	else:
		i_base = full_load_current_kva(data.load_kva, data.voltage)

	i_derated = derated_current(i_base, data.derating_factors)

	# Voltage drop
	vdrop = voltage_drop_percent(i_base, data.length, data.mv_per_a_m, data.voltage)

	# Select cable CSA by meeting derated current
	selected_csa = None
	for csa in sorted(data.csa_options):
		if csa >= i_derated:
			selected_csa = csa
			break

	if selected_csa is None:
		selected_csa = max(data.csa_options)

	# SC Check
	sc_ok, a_required = short_circuit_check(
		data.sc_current,
		data.sc_time,
		data.k_const,
		selected_csa,
	)

	vdrop_ok = vdrop <= 5  # default for LV

	return CableOutput(
		cable_number=data.cable_number,
		flc=round(i_base, 2),
		derated_current=round(i_derated, 2),
		selected_csa=selected_csa,
		vdrop_percent=round(vdrop, 3),
		sc_required_area=round(a_required, 2),
		sc_ok=sc_ok,
		vdrop_ok=vdrop_ok,
	)


@router.post("/bulk-size", response_model=List[CableOutput])
def bulk_size_cables(data: List[CableInput]):
	results: List[CableOutput] = []

	for cable in data:
		# Determine base current
		if cable.current and cable.current > 0:
			i_base = cable.current
		elif cable.load_kw and cable.load_kw > 0:
			i_base = full_load_current_kw(cable.load_kw, cable.voltage, cable.pf or 1.0, cable.eff or 1.0)
		else:
			i_base = full_load_current_kva(cable.load_kva or 0, cable.voltage)

		i_derated = derated_current(i_base, cable.derating_factors or [1.0])

		# Voltage drop
		vdrop = voltage_drop_percent(i_base, cable.length, cable.mv_per_a_m, cable.voltage)

		# Select cable CSA by meeting derated current
		selected_csa = None
		for csa in sorted(cable.csa_options or []):
			if csa >= i_derated:
				selected_csa = csa
				break

		if selected_csa is None and cable.csa_options:
			selected_csa = max(cable.csa_options)

		# SC Check
		sc_ok, a_required = short_circuit_check(
			cable.sc_current or 0,
			cable.sc_time or 1,
			cable.k_const or 115,
			selected_csa or 0,
		)

		vdrop_ok = vdrop <= 5  # for now LV default

		results.append(
			CableOutput(
				cable_number=cable.cable_number or "",
				flc=round(i_base, 2),
				derated_current=round(i_derated, 2),
				selected_csa=selected_csa or 0,
				vdrop_percent=round(vdrop, 3),
				sc_required_area=round(a_required, 2),
				sc_ok=bool(sc_ok),
				vdrop_ok=bool(vdrop_ok),
			)
		)

	return results



@router.post('/upload', response_model=dict)
def upload_excel(file: UploadFile = File(...)):
	"""Upload an Excel file and return detected headers, sample rows and a token to map later."""
	if not file.filename.lower().endswith(('.xls', '.xlsx')):
		raise HTTPException(status_code=400, detail='Only Excel files are supported')

	token = str(uuid.uuid4())
	save_path = f"/tmp/{token}.xlsx"
	with open(save_path, 'wb') as f:
		f.write(file.file.read())

	try:
		df = pd.read_excel(save_path, engine='openpyxl')
	except Exception as e:
		raise HTTPException(status_code=400, detail=f'Failed to read Excel: {e}')

	headers = [str(c) for c in df.columns.tolist()]
	sample = df.head(10).fillna('').to_dict(orient='records')

	return {'token': token, 'headers': headers, 'sample': sample}


@router.post('/map-upload', response_model=list)
def map_upload(payload: dict):
	"""Accepts { token: str, mapping: {targetField: columnName} } and returns array of BulkRow-like objects."""
	token = payload.get('token')
	mapping = payload.get('mapping') or {}
	if not token:
		raise HTTPException(status_code=400, detail='token required')

	path = f"/tmp/{token}.xlsx"
	if not os.path.exists(path):
		raise HTTPException(status_code=404, detail='Uploaded file not found')

	try:
		df = pd.read_excel(path, engine='openpyxl')
	except Exception as e:
		raise HTTPException(status_code=400, detail=f'Failed to read saved Excel: {e}')

	results = []
	for _, row in df.fillna('').iterrows():
		out = {
			'cable_number': str(row.get(mapping.get('cable_number', ''), '')),
			'from_equipment': str(row.get(mapping.get('from_equipment', ''), '')),
			'to_equipment': str(row.get(mapping.get('to_equipment', ''), '')),
			'load_kw': float(row.get(mapping.get('load_kw', ''), 0) or 0),
			'load_kva': float(row.get(mapping.get('load_kva', ''), 0) or 0),
			'current': float(row.get(mapping.get('current', ''), 0) or 0),
			'voltage': float(row.get(mapping.get('voltage', ''), 415) or 415),
			'pf': float(row.get(mapping.get('pf', ''), 1.0) or 1.0),
			'eff': float(row.get(mapping.get('eff', ''), 1.0) or 1.0),
			'length': float(row.get(mapping.get('length', ''), 0) or 0),
			'mv_per_a_m': float(row.get(mapping.get('mv_per_a_m', ''), 0.44) or 0.44),
			'derating1': float(row.get(mapping.get('derating1', ''), 1) or 1),
			'derating2': float(row.get(mapping.get('derating2', ''), 1) or 1),
			'sc_current': float(row.get(mapping.get('sc_current', ''), 0) or 0),
			'sc_time': float(row.get(mapping.get('sc_time', ''), 1) or 1),
			'k_const': float(row.get(mapping.get('k_const', ''), 115) or 115),
		}
		results.append(out)

	return results

