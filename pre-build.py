import subprocess
import xml.etree.ElementTree as et
import datetime
import json
import os.path
import os

def IncrementVersionString(verstr):
	verstr = verstr.split('.')

	major = int(verstr[0])
	minor = int(verstr[1])
	build = int(verstr[2])
	rev = int(verstr[3])

	dt = datetime.date.today()
	# The version is split into two 16-bit fields.
	# major.minor.YMM.DDRRR
	build = (dt.year - 2016) * 100 + dt.month
	rev_rrr = rev - (rev // 1000 * 1000)
	rev = dt.day * 1000 + (rev_rrr + 1)

	return '%s.%s.%s.%s' % (major, minor, build, rev)

def IncrementVersionOnProject(breaking_changes=False):
	buildinfo_path = 'buildinfo.json'
	if os.path.exists(buildinfo_path):
		fd = open(buildinfo_path, 'r')
		buildinfo = json.loads(fd.read())
		fd.close()
	else:
		buildinfo = {
			'version': '0.0.0.0',
		}

	buildinfo['version'] = IncrementVersionString(buildinfo['version'])

	fd = open(buildinfo_path, 'w')
	fd.write(json.dumps(buildinfo))
	fd.close()

print('+ incrementing version')
IncrementVersionOnProject()

def jsx_to_js(infile, outputs):
	print('+ compiling JSX into JS for %s' % infile)
	stdout, stderr = subprocess.Popen([
			'babel',
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