#!python3
import subprocess
import xml.etree.ElementTree as et
import datetime
import json
import os.path
import os
import sys

babelBinary = sys.argv[1]

def jsx_to_js(infile, outputs):
	print('+ compiling JSX into JS for %s' % infile)
	stdout, stderr = subprocess.Popen([
			babelBinary,
			'--plugins',
			'transform-react-jsx',
			infile,
	], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate('')

	stderr = stderr.decode('utf8')
	stdout = stdout.decode('utf8')

	if len(stderr) > 0:
		print(stderr)
		raise Exception('jsx_to_js failed')

	for (outfile, outfilemode) in outputs:
		print(' - writing %s' % outfile)
		fd = open(outfile, outfilemode)
		fd.write('/// <jsx-source-file>%s</jsx-source-file>\n' % infile)
		fd.write(stdout)
		fd.close()

def compile_jsx_and_concat(pdir, odir):
	nodes = os.listdir(pdir)
	
	fd = open(os.path.join(pdir, 'MDACSDataWorker.js'), 'r')
	xfd = open(os.path.join(odir, 'MDACSDataWorker.js'), 'w')
	xfd.write(fd.read())
	xfd.close()
	fd.close()

	open(os.path.join(odir, 'package.js'), 'w').close()

	for node in nodes:
		(node_base, ext) = os.path.splitext(node)

		if ext != '.jsx':
			continue
		
		if node_base == 'app':
			continue

		pd = [
			# out
			(os.path.join(odir, 'package.js'), 'a'),
		]

		if node_base == 'daos':
			# out
			pd.append(
				(os.path.join(odir, 'daos.js'), 'a')
			)
		
		jsx_to_js(
			os.path.join(pdir, node), 
			pd
		)
	
	if os.path.exists(os.path.join(pdir, 'app.jsx')):
		jsx_to_js(
			os.path.join(pdir, 'app.jsx'), 
			[
				(os.path.join(odir, 'package.js'), 'a'),
			]
		)	

compile_jsx_and_concat('./websrc', './webres')
