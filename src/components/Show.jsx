import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, getDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebaseConfig/firebase'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import JsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { async } from '@firebase/util'
const MySwal = withReactContent(Swal)

const Show = () => {
    //1 - configuramos los hooks
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('producto'); // Asumiendo que 'producto' es un campo
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' para ascendente o 'desc' para descendente

    //2 - referenciamos a la DB firestore
    const productsCollection = collection(db, "inventario")

    //3 - Funcion para mostrar TODOS los docs
    const getProducts = async () => {
        const data = await getDocs(productsCollection)
        //console.log(data.docs)
        setProducts(
            data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        )
        //console.log(products)
    }
    //4 - Funcion para eliminar un doc
    const deleteProduct = async (id) => {
        const productDoc = doc(db, "inventario", id)
        await deleteDoc(productDoc)
        getProducts()
    }
    //5 - Funcion de confirmacion para Sweet Alert 2
    const confirmDelete = (id) => {
        MySwal.fire({
            title: '¿Elimina el producto?',
            text: "No puedes revertir esta accion!",
            icon: 'Advertencia',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Si, eliminalo!'
        }).then((result) => {
            if (result.isConfirmed) {
                //llamamos a la fcion para eliminar   
                deleteProduct(id)
                Swal.fire(
                    'Eliminado!',
                    'Tu producto se ha eliminado.',
                    'exito'
                )
            }
        })
    }
    //6 - usamos useEffect
    useEffect(() => {
        let result = products;
        // Filtrado
        if (searchTerm) {
            result = result.filter(product =>
                product.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
                // Agrega más campos de búsqueda si es necesario
            );
        }

        // Ordenamiento
        result = result.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        getProducts()
        // eslint-disable-next-line
        setFilteredProducts(result);

    }, [products, searchTerm, sortKey, sortOrder]);
    //7 - devolvemos vista de nuestro componente

    const downloadPdf = () => {
        const input = document.getElementById('miTabla'); // Asegúrate de que tu tabla tenga este ID
        html2canvas(input, {
            useCORS: true,
            logging: true,
            letterRendering: 1,
        }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new JsPDF({
                orientation: 'landscape',
            });
            const imgWidth = 208; // Asumiendo un tamaño de página A4
            const pageHeight = 295;  // Altura en mm de una página A4
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save("download.pdf");
        });
    };

    return (
        <>
            <div className='container' id="miTabla">
                <div className='row'>
                    <div className='col'>
                        <div className="d-grid gap-2">
                            <Link to="/create" className='btn btn-secondary mt-2 mb-2'>Crear</Link>
                            <button onClick={downloadPdf} className="btn btn-primary">Descargar PDF</button>

                        </div>

                        <div>
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                                    <option value="producto">Producto</option>
                                    <option value="existencia">Existencia</option>
                                    <option value="transaccion">Transacción</option>
                                    {/* Agrega más opciones de ordenamiento si es necesario */}
                                </select>
                                <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                                    Orden {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                                </button>
                            </div>
                        <table className='table table-dark table-hover'>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Existencia</th>
                                    <th>Transaccion</th>
                                    <th>Descripcion</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>

                                    

                                </tr>
                            </thead>

                            
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.producto}</td>
                                        <td>{product.existencia}</td>
                                        <td>{product.transaccion}</td>
                                        <td>{product.descripcion}</td>
                                        <td>{new Date(product.fecha.seconds * 1000).toLocaleString()}</td>
                                        <td>
                                            <Link to={`/edit/${product.id}`} className="btn btn-light"><i className="fa-solid fa-pencil"></i></Link>
                                            <button onClick={() => { confirmDelete(product.id) }} className="btn btn-danger"><i className="fa-solid fa-trash"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Show