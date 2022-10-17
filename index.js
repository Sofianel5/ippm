import * as IPFS from 'ipfs-core'
import OrbitDB from 'orbit-db'
import fs from 'fs/promises'
import path from 'path'

async function initDB(orbitdb) {
    const options = {
        // Give write access to everyone
        accessController: {
          write: ['*']
        }
    }
    const db = await orbitdb.keyvalue('ippm', options) // maybe use orbitdb.docs to enable more features
    console.log(db.address.toString())
}

async function loadDB(orbitdb, dbAddress) {
    const db = await orbitdb.keyvalue(dbAddress)
    await db.load()
    return db
}

async function addToDB(instance, packageName, packageData) {
    const db = await instance.keyvalue('ippm')
    await db.load()
    db.put(packageName, packageData)
}

function constructPackageData(packageName, packageVersion, packageHash, packageOwnerPk) {
    return {
        name: packageName,
        creator: packageOwnerPk,
        releases: [
            {
                version: packageVersion,
                cid: packageHash
            }
        ]
    }
}

async function constructPackageHash(ipfs, packageDataPath) {
    /*
    * @param packageDataPath: path to package data, a folder containing package executables for different platforms and a json file mapping platform names to executable names named 'info.json'
    */
    const packageData = await fs.readFile(packageDataPath)
    const packageHash = ipfs.add(packageData)
    return packageHash
}

async function getPackageData(db, packageName) {
    const obj = db.get(packageName)
    // console.log(obj)
    return obj
}

async function getPackage(orbitdb, db, packageName, packageVersion) {
    // console.log('getPackage')
    const packageData = await getPackageData(db, packageName)
    console.log(packageData)
    const versions = await orbitdb.eventlog(packageData.packages)
    console.log('abt to load')
    await versions.load()
    console.log('loaded')
    for (const release of versions.iterator({ limit: -1 }).collect()) {
        // console.log("release", release)
        console.log(release.payload.value.platforms)
        if (release.version == packageVersion) {
            return release.cid
        }
    }
    console.log('done loopin')
    return null
}

async function addPackage(ipfs, orbitdb, db) {
    const packagePath = process.argv[3];
    if (packagePath == null) {
        console.log('Please specify a path to the package data.')
        return
    }

    const packageData = JSON.parse((await fs.readFile(path.join(packagePath, 'info.json'))).toString())
    let packageDb;
    if (db.get(packageData.package_name) != null) {
        console.log('Package already exists.')
        console.log(db.get(packageData.package_name))
        return
    } else {
        const dbName = 'package.' + packageData.package_name
        packageDb = await orbitdb.eventlog(dbName)
        const cid = await db.set(packageData.package_name, {
            packages: packageDb.id,
            ...packageData,
        })
    }
    for (const platform in packageData.platforms) {
        const platformData = packageData.platforms[platform]
        const platformPath = path.join(packagePath, platformData.path)
        const platformHash = await constructPackageHash(ipfs, platformPath)
        // console.log(platformHash)
        packageData.platforms[platform].hash = platformHash.path
    }
    packageDb.add(packageData)
    console.log("added packages")
}

async function main () {
    // console.log('hi')
    const ipfsOptions = { repo: './ipfs',}
    console.log('before')
    const ipfs = await IPFS.create(ipfsOptions)
    console.log('after')
    // const ipfs = new IPFS();
    const orbitdb = await OrbitDB.createInstance(ipfs)
    console.log('IPFS node is ready')
    // const db = await loadDB(orbitdb, 'ippm')
    const db = await orbitdb.keyvalue('/orbitdb/zdpuAmUKRWgTpjvDSBpYoisAYnCG8mF5mpqBhW1Yzye9UgWLW/ippm')
    console.log(db.id)

    const option = process.argv[2]
    if (option == 'add') {
        await addPackage(ipfs, orbitdb, db)
    } else if (option == 'get') {
        const packageName = process.argv[3]
        const packageVersion = process.argv[4]
        console.log(packageVersion, packageVersion!=null)
        const packageData = packageVersion!=null ? await getPackage(orbitdb, db, packageName, packageVersion) : await getPackageData(db, packageName)
    }
    return 0;
}

main();