from pygaff.conf import API_URI, API_USERNAME, API_PASSWORD
import pygaff.compile
import pygaff.log
import pygaff.api

from flask import Flask, Response
app = Flask(__name__)

import json, traceback

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/world")
def world():
    api = pygaff.api.WikiAPI (API_URI, API_USERNAME, API_PASSWORD)
    api.login()
    logger = pygaff.log.EventLogger(info=[],error=[],warning=[])
    compiler = pygaff.compile.WorldCompiler (api, log=logger)
    world = compiler.compile()
    exporter = pygaff.api.WorldJSONExporter (world)
    return Response(exporter.to_string(),mimetype='application/json')

@app.route("/compile")
def compile():
    logger = pygaff.log.EventLogger(info=[],error=[],warning=[])
    logger.info ('Processing compile request.')
    compiler_output = ""
    try:
        api = pygaff.api.WikiAPI (API_URI, API_USERNAME, API_PASSWORD, log=logger)
        api.login()
        compiler = pygaff.compile.WorldCompiler (api, log=logger)
        world = compiler.compile()
        exporter = pygaff.api.WorldJSONExporter (world)
        logger.info ('Compile request completed successfully.')
        compiler_output = exporter.to_string()
    except Exception as e:
        logger.error ('Fatal error during compilation: unhandled exception.')
        tb_lines = traceback.format_exc().strip().split('\n')
        for line in tb_lines: logger.debug (line)

    log_data = [[
        float(r[0].strftime('%s')),
        r[1],
        r[2]] for r in logger.log]
    compile_data = {
        'log': log_data,
        'output': compiler_output,
    }
    compile_json = json.dumps(compile_data, sort_keys=True, indent=4)
    return Response(compile_json,mimetype='application/json')

@app.route("/crop")
def crop_image ():
    return "not implemented yet!"

if __name__ == "__main__":
    app.run(host='0.0.0.0')

